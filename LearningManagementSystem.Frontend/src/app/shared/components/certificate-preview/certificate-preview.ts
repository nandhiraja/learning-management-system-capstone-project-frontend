import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  closeModal() {
    this.close.emit();
  }
}
