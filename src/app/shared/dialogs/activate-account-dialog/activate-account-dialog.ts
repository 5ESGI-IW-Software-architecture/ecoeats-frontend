import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { executeObservable } from '../../../core/utils/observables.utils';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { createState } from '../../../core/types/state.types';

interface ActivateAccountDialogData {
  email: string;
}

@Component({
  selector: 'app-activate-account-dialog',
  imports: [ReactiveFormsModule, FormsModule],
  templateUrl: './activate-account-dialog.html',
  styleUrl: './activate-account-dialog.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivateAccountDialog {
  private readonly dialogRef = inject(MatDialogRef<ActivateAccountDialog>);
  private readonly data = inject<ActivateAccountDialogData>(MAT_DIALOG_DATA);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly state = signal(createState<void>());
  protected readonly email = this.data.email;

  protected readonly code = signal('');

  protected readonly validationError = signal<string | null>(null);

  handleVerifyClick(): void {
    if (this.code() === '') {
      this.validationError.set('Please enter the verification code.');
      return;
    }

    this.validationError.set(null);
    executeObservable(this.authService.activate$(this.email, Number(this.code())), {
      state: this.state,
      destroyRef: this.destroyRef,
      onSuccess: () => this.dialogRef.close(true),
    });
  }
}
