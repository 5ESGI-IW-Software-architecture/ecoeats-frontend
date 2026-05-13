import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { AuthStore } from '../../../../shared/services/auth.store';
import { DelivererUserType } from '../../../../shared/types/user.type';
import { DeliveriesService } from '../../../../shared/services/delivereies-service';
import { executeObservable } from '../../../../core/utils/observables.utils';
import { ComponentState, createState } from '../../../../core/types/state.types';
import {
  FeedbackDisplayDialog,
  FeedbackDialogData,
} from '../../../../shared/dialogs/feedback-display-dialog/feedback-display-dialog';
import { AuthService } from '../../../../core/auth/auth.service';

export type DeliveryProposal = {
  id: string;
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  estimatedEarnings: number;
  baseFee: number;
  tip: number;
  status: 'ReadyForPickup' | 'InPreparation';
};

export type ActiveDelivery = {
  id: string;
  orderId: string;
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
  distanceKm: number;
  estimatedEarnings: number;
  baseFee: number;
  tip: number;
  status: 'Accepted' | 'PickedUp';
};

export type AcceptDeliveryResponse = {
  deliveryId: string;
};

@Component({
  selector: 'app-dashboard',
  imports: [NgTemplateOutlet],
  templateUrl: './dashboard.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly userStore = inject(AuthStore);
  private readonly deliveryService = inject(DeliveriesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);

  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private readonly POLLING_INTERVAL_MS = 5_000;

  readonly deliverer = computed(() => this.userStore.user() as DelivererUserType);

  readonly isAvailable = signal<boolean>(true);
  readonly updateAvailabilityState = signal<ComponentState<void>>(createState());

  toggleAvailability(): void {
    const newAvailability = !this.isAvailable();
    this.isAvailable.set(newAvailability);

    executeObservable(this.deliveryService.updateAvailability$(newAvailability), {
      state: this.updateAvailabilityState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        if (!newAvailability) {
          this.proposals.set([]);
        } else {
          this.fetchProposals();
        }
      },
      onError: () => this.isAvailable.set(!newAvailability),
    });
  }

  readonly proposalsState = signal<ComponentState<DeliveryProposal[]>>(createState());
  readonly proposals = signal<DeliveryProposal[]>([]);

  readonly activeDeliveriesState = signal<ComponentState<ActiveDelivery[]>>(createState());
  readonly activeDeliveries = signal<ActiveDelivery[]>([]);

  readonly acceptState = signal<ComponentState<void>>(createState());
  readonly pickupState = signal<ComponentState<void>>(createState());
  readonly deliveredState = signal<ComponentState<void>>(createState());

  readonly sessionDeliveryCount = signal<number>(0);
  readonly sessionEarnings = signal<number>(0);

  readonly expandedId = signal<string | null>(null);

  toggleExpand(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }

  isExpanded(id: string): boolean {
    return this.expandedId() === id;
  }

  ngOnInit(): void {
    const deliverer = this.userStore.user() as DelivererUserType;
    if (deliverer?.availability !== undefined) {
      this.isAvailable.set(deliverer.availability === 'Available');
    }

    this.startPolling();
    this.destroyRef.onDestroy(() => this.stopPolling());
  }

  acceptDelivery(orderId: string): void {
    executeObservable(this.deliveryService.acceptDelivery$(orderId), {
      state: this.acceptState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.fetchActiveDeliveries();
        this.fetchProposals();
      },
      onError: (httpError: HttpErrorResponse) => {
        if (httpError.status === 409) {
          const message = this.deliverer().isExpert
            ? 'Expert deliverers can only hold 2 deliveries from the same restaurant.'
            : 'You already have an active delivery. Complete it before accepting another.';
          this.openFeedbackDialog('error', message);
        } else if (httpError.status === 404) {
          this.openFeedbackDialog(
            'error',
            'This delivery no longer exists. It may have been cancelled.',
          );
        } else {
          this.openFeedbackDialog('error', 'Something went wrong. Please try again.');
        }
      },
    });
  }

  markPickedUp(deliveryId: string): void {
    executeObservable(this.deliveryService.markPickedUp$(deliveryId), {
      state: this.pickupState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.activeDeliveries.update((list) =>
          list.map((d) => (d.id === deliveryId ? { ...d, status: 'PickedUp' as const } : d)),
        );
      },
      onError: (httpError: HttpErrorResponse) => {
        if (httpError.status === 404) {
          this.openFeedbackDialog(
            'error',
            'This delivery no longer exists. It may have been cancelled.',
          );
        } else {
          this.openFeedbackDialog('error', 'Something went wrong. Please try again.');
        }
      },
    });
  }

  markDelivered(deliveryId: string): void {
    executeObservable(this.deliveryService.markDelivered$(deliveryId), {
      state: this.deliveredState,
      destroyRef: this.destroyRef,
      onSuccess: () => {
        this.fetchProposals();
        this.fetchActiveDeliveries();
        this.authService.resetUser().subscribe();
      },
      onError: (httpError: HttpErrorResponse) => {
        if (httpError.status === 404) {
          this.openFeedbackDialog(
            'error',
            'This delivery no longer exists. It may have been cancelled.',
          );
        } else {
          this.openFeedbackDialog('error', 'Something went wrong. Please try again.');
        }
      },
    });
  }

  private openFeedbackDialog(variant: FeedbackDialogData['variant'], message: string): void {
    const data: FeedbackDialogData = { variant, message };
    this.dialog.open(FeedbackDisplayDialog, { data });
  }

  private startPolling(): void {
    this.fetchProposals();
    this.fetchActiveDeliveries();
    this.pollingInterval = setInterval(() => {
      this.fetchProposals();
      this.fetchActiveDeliveries();
    }, this.POLLING_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private fetchProposals(): void {
    if (!this.isAvailable()) return;

    executeObservable(this.deliveryService.getDeliveries$(), {
      state: this.proposalsState,
      destroyRef: this.destroyRef,
      onSuccess: (proposals) => {
        const normalized: DeliveryProposal[] = proposals.map((p) => ({
          ...p,
          tip: Number(p.tip),
          estimatedEarnings: Number(p.estimatedEarnings),
        }));
        this.proposals.set(normalized);
      },
    });
  }

  private fetchActiveDeliveries(): void {
    executeObservable(this.deliveryService.getActiveDeliveries$(), {
      state: this.activeDeliveriesState,
      destroyRef: this.destroyRef,
      onSuccess: (deliveries) => {
        if (
          this.acceptState().loading ||
          this.pickupState().loading ||
          this.deliveredState().loading
        )
          return;

        const normalized: ActiveDelivery[] = deliveries.map((d) => ({
          ...d,
          tip: Number(d.tip),
          estimatedEarnings: Number(d.estimatedEarnings),
        }));
        this.activeDeliveries.set(normalized);
      },
    });
  }
}
