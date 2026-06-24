import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  auth = inject(AuthService);
  notification = inject(NotificationService);
  router = inject(Router);

  registerForm = new FormGroup({
    firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
    lastName: new FormControl('', [Validators.required, Validators.minLength(1)]),
    userName: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    phoneNo: new FormControl('', [Validators.required, Validators.pattern('^[0-9\\+\\-\\s()]+$')]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  isLoading = false;

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const formValue = this.registerForm.value;

    this.auth.register(formValue).subscribe({
      next: () => {
        this.notification.success('Account created successfully! Please log in.');
        this.router.navigate(['/auth/login']);
        this.isLoading = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.error || 'Registration failed. Please check your inputs.';
        this.notification.error(errorMsg);
        this.isLoading = false;
      }
    });
  }
}
