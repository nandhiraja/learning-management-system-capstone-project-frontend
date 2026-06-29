import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LectureResponse } from '../../../../../../../models/course.model';

@Component({
  selector: 'app-classroom-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-player.component.html',
  styleUrl: './classroom-player.component.css'
})
export class ClassroomPlayerComponent implements OnChanges {
  @Input({ required: true }) lecture: LectureResponse | null = null;
  @Input() isCompleted = false;

  @Output() videoEnded = new EventEmitter<void>();
  @Output() markComplete = new EventEmitter<void>();

  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);

  // States
  protected fetchedTextContent = signal<string | null>(null);
  protected isFetchingText = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lecture'] && this.lecture) {
      this.fetchedTextContent.set(null);
      if (this.isTextOrMarkdown) {
        this.fetchTextContent();
      }
    }
  }

  get absoluteUrl(): string {
    if (!this.lecture || !this.lecture.contentUrl) return '';
    let url = this.lecture.contentUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `http://localhost:5159${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  }

  get safeUrl(): SafeResourceUrl | null {
    let url = this.absoluteUrl;
    if (!url) return null;
    if (url.toLowerCase().endsWith('.pdf')) {
      url += '#toolbar=0';
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get isLocalhost(): boolean {
    return this.absoluteUrl.includes('localhost') || this.absoluteUrl.includes('127.0.0.1');
  }

  get isTextOrMarkdown(): boolean {
    if (!this.lecture) return false;
    const type = this.lecture.contentType.toLowerCase();
    const url = this.lecture.contentUrl.toLowerCase();
    return type === 'text' || url.endsWith('.md') || url.endsWith('.txt');
  }

  get isOfficeDocument(): boolean {
    if (!this.lecture) return false;
    const url = this.lecture.contentUrl.toLowerCase();
    return url.endsWith('.ppt') || url.endsWith('.pptx') || url.endsWith('.doc') || url.endsWith('.docx') || url.endsWith('.xls') || url.endsWith('.xlsx');
  }

  get googleDocsViewerUrl(): SafeResourceUrl | null {
    const url = this.absoluteUrl;
    if (!url) return null;
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  fetchTextContent() {
    const url = this.absoluteUrl;
    if (!url) return;

    this.isFetchingText.set(true);
    this.http.get(url, { responseType: 'text' }).subscribe({
      next: (content) => {
        this.fetchedTextContent.set(content);
        this.isFetchingText.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch text content from server', err);
        this.fetchedTextContent.set('Unable to load reading content. Please download the file or try again later.');
        this.isFetchingText.set(false);
      }
    });
  }

  onVideoEnded() {
    this.videoEnded.emit();
  }

  handleMarkComplete() {
    this.markComplete.emit();
  }
}
