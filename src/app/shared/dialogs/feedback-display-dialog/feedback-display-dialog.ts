import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface FeedbackDialogData {
  message: string;
  variant: 'success' | 'warning' | 'error';
}

@Component({
  selector: 'app-feedback-display-dialog',
  imports: [],
  templateUrl: './feedback-display-dialog.html',
  styleUrl: './feedback-display-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class FeedbackDisplayDialog {
  protected readonly data: FeedbackDialogData = inject(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<FeedbackDisplayDialog>);

  close(): void {
    this.dialogRef.close();
  }
}
