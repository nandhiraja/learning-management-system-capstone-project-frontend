import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PublicService, VerifiedCertificate } from '../../core/services/public.service';

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verify-certificate.component.html',
  styleUrls: ['./verify-certificate.component.css']
})
export class VerifyCertificateComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private publicService = inject(PublicService);

  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  certificate = signal<VerifiedCertificate | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const verificationId = params.get('verificationId');
      if (verificationId) {
        this.verify(verificationId);
      } else {
        this.error.set('No verification ID provided.');
        this.loading.set(false);
      }
    });
  }

  verify(verificationId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.publicService.verifyCertificate(verificationId).subscribe({
      next: (cert) => {
        this.certificate.set(cert);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Certificate verification failed:', err);
        this.error.set('This certificate is invalid or could not be found.');
        this.loading.set(false);
      }
    });
  }
}
