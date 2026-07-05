import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { StatCardComponent, StatCardData } from '../../../shared/components/stat-card/stat-card.component';
import { ProgressBarComponent } from '../../../shared/components/progress-bar/progress-bar.component';
import { BadgeChipComponent } from '../../../shared/components/badge-chip/badge-chip.component';
import { CertificatePreview } from '../../../shared/components/certificate-preview/certificate-preview';
import { EnrollmentResponse, CertificateResponse } from '../../../models/enrollment.model';
import { NotificationService } from '../../../shared/services/notification.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    StatCardComponent,
    ProgressBarComponent,
    BadgeChipComponent,
    CertificatePreview
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  protected auth = inject(AuthService);
  private enrollmentService = inject(EnrollmentService);
  private notification = inject(NotificationService);

  // Name correction form state
  certNameForm = new FormGroup({
    certificateName: new FormControl('', [Validators.required, Validators.minLength(2)])
  });
  isSavingCertName = signal(false);
  isEditingCertName = false;

  constructor() {
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.certNameForm.patchValue({
          certificateName: user.certificateName
        });
      }
    });
  }

  // Signals for state
  protected enrollments = signal<EnrollmentResponse[]>([]);
  protected certificates = signal<CertificateResponse[]>([]);
  protected isLoading = signal<boolean>(true);
  protected activeTab = signal<'courses' | 'certificates'>('courses');

  // Computed properties
  protected activeCourses = computed(() =>
    this.enrollments().filter(course => course.progress < 100)
  );

  protected completedCourses = computed(() =>
    this.enrollments().filter(course => course.progress === 100)
  );

  protected averageProgress = computed(() => {
    const list = this.enrollments();
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, curr) => acc + curr.progress, 0);
    return Math.round(sum / list.length);
  });

  protected stats = computed<StatCardData[]>(() => [
    {
      value: this.activeCourses().length,
      label: 'Active courses',
      icon: 'bi-book',
      iconBg: 'var(--color-accent-soft)',
      iconColor: 'var(--color-accent)'
    },
    {
      value: `${this.averageProgress()}%`,
      label: 'Average progress',
      icon: 'bi-graph-up',
      iconBg: 'var(--color-success-soft)',
      iconColor: 'var(--color-success)'
    },
    {
      value: this.certificates().length,
      label: 'Certificates earned',
      icon: 'bi-patch-check',
      iconBg: 'var(--color-warning-soft)',
      iconColor: 'var(--color-warning)'
    },
    {
      value: this.enrollments().length,
      label: 'Total enrollments',
      icon: 'bi-mortarboard',
      iconBg: 'var(--color-purple-soft)',
      iconColor: 'var(--color-purple)'
    }
  ]);

  ngOnInit(): void {
    this.fetchDashboardData();
  }

  fetchDashboardData(): void {
    this.isLoading.set(true);
    forkJoin({
      courses: this.enrollmentService.getEnrolledCourses(),
      certs: this.enrollmentService.getCertificates()
    }).subscribe({
      next: ({ courses, certs }) => {
        this.enrollments.set(courses);
        this.certificates.set(certs);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard statistics', err);
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: 'courses' | 'certificates'): void {
    this.activeTab.set(tab);
  }

  // Certificate Modal State
  protected selectedCertificate = signal<CertificateResponse | null>(null);

  openCertificate(cert: CertificateResponse) {
    this.selectedCertificate.set(cert);
  }

  closeCertificate() {
    this.selectedCertificate.set(null);
  }

  startEditingCertName() {
    const user = this.auth.currentUser();
    if (user) {
      this.certNameForm.patchValue({
        certificateName: user.certificateName
      });
      this.isEditingCertName = true;
    }
  }

  cancelEditingCertName() {
    this.isEditingCertName = false;
  }

  onSubmitCertName() {
    if (this.certNameForm.invalid) {
      this.certNameForm.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser();
    if (user && user.certificateNameChangesCount >= 2) {
      this.notification.error('You have reached the maximum number of allowed certificate name corrections.');
      return;
    }

    this.isSavingCertName.set(true);
    const newName = this.certNameForm.value.certificateName || '';

    this.auth.updateCertificateName(newName).subscribe({
      next: () => {
        this.notification.success('Certificate name updated successfully!');
        this.isSavingCertName.set(false);
        this.isEditingCertName = false;
        this.fetchDashboardData();
      },
      error: (err) => {
        const errorMsg = err.error?.message || 'Failed to update certificate name.';
        this.notification.error(errorMsg);
        this.isSavingCertName.set(false);
      }
    });
  }
}
