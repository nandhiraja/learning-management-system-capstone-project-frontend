import { Component, inject, effect, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent {
  auth = inject(AuthService);
  notification = inject(NotificationService);
  router = inject(Router);

  profileForm = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    lastName: new FormControl('', [Validators.required, Validators.minLength(1)]),
    phoneNo: new FormControl('', [Validators.required, Validators.pattern('^[0-9\\+\\-\\s()]+$')])
  });

  uploadedPictureUrl: string | null = null;
  isUploading = false;
  isSaving = false;
  isRequestingRole = false;

  constructor() {
    // Dynamically populate form once user details are loaded from session
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.profileForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNo: user.phoneNo
        });
        this.uploadedPictureUrl = user.profilePictureUrl;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      this.isUploading = true;
      this.auth.uploadImage(file).subscribe({
        next: (res) => {
          this.uploadedPictureUrl = res.url;
          this.notification.success('Profile picture uploaded successfully! Remember to save changes.');
          this.isUploading = false;
        },
        error: (err) => {
          const errorMsg = err.error?.message || err.error || 'Failed to upload profile picture.';
          this.notification.error(errorMsg);
          this.isUploading = false;
        }
      });
    }
  }

  onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formValue = this.profileForm.value;
    const payload = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      phoneNo: formValue.phoneNo,
      profilePictureUrl: this.uploadedPictureUrl
    };

    this.auth.updateProfile(payload).subscribe({
      next: () => {
        this.notification.success('Profile updated successfully!');
        this.isSaving = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to update profile details.';
        this.notification.error(errorMsg);
        this.isSaving = false;
      }
    });
  }

  requestInstructorRole() {
    this.isRequestingRole = true;
    this.auth.becomeInstructor().subscribe({
      next: (res) => {
        const msg = res.message || 'Instructor request submitted successfully!';
        this.notification.success(msg);
        this.isRequestingRole = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to submit instructor request.';
        this.notification.error(errorMsg);
        this.isRequestingRole = false;
      }
    });
  }
}
