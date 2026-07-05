import { Component, inject, effect, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
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
  isEditing = false; // By default read-only view mode

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

  toggleEdit() {
    this.isEditing = !this.isEditing;
  }

  cancelEdit() {
    this.isEditing = false;
    // Reset form to latest saved values
    const user = this.auth.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNo: user.phoneNo
      });
      this.uploadedPictureUrl = user.profilePictureUrl;
    }
  }

  onFileSelected(event: Event) {
    if (!this.isEditing) return; // Prevent photo selection when not in edit mode
    
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

  removePhoto() {
    if (!this.isEditing) return;
    this.uploadedPictureUrl = null;
    this.notification.success('Profile picture removed! Click "Save profile" to save changes.');
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
        this.isEditing = false; // Close edit mode back to read-only view
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
