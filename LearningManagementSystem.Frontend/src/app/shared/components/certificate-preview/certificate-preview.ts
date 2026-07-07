import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-certificate-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './certificate-preview.html',
  styleUrls: ['./certificate-preview.css']
})
export class CertificatePreview {
  @Input({ required: true }) cert!: any;
  @Output() close = new EventEmitter<void>();

  private sanitizer = inject(DomSanitizer);

  get safeUrl(): SafeResourceUrl {
    const url = `${this.cert.certificateUrl}#toolbar=0&navpanes=0&scrollbar=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  closeModal() {
    this.close.emit();
  }
}
