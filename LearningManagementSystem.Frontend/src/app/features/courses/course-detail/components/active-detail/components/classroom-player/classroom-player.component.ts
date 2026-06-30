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
  @Output() updateProgress = new EventEmitter<number>();

  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);

  // States
  protected fetchedTextContent = signal<string | null>(null);
  protected isFetchingText = signal<boolean>(false);
  protected externalLinkClicked = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lecture'] && this.lecture) {
      this.fetchedTextContent.set(null);
      this.externalLinkClicked.set(false);
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

  get mediaStreamUrl(): string {
    if (!this.lecture || !this.lecture.contentUrl) return '';
    return `http://localhost:5159/api/Media/stream?path=${encodeURIComponent(this.lecture.contentUrl)}`;
  }

  get mediaDocumentUrl(): string {
    if (!this.lecture || !this.lecture.contentUrl) return '';
    return `http://localhost:5159/api/Media/document?path=${encodeURIComponent(this.lecture.contentUrl)}`;
  }

  get safeUrl(): SafeResourceUrl | null {
    let url = this.lecture?.contentType === 'pdf' ? this.mediaDocumentUrl : this.absoluteUrl;
    if (!url) return null;
    if (url.toLowerCase().endsWith('.pdf') || url.includes('/api/Media/document')) {
      url += '#toolbar=0';
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get isLocalhost(): boolean {
    return this.absoluteUrl.includes('localhost') || this.absoluteUrl.includes('127.0.0.1');
  }

  get isVideo(): boolean {
    return this.lecture?.contentType?.toLowerCase() === 'video';
  }

  get isPdf(): boolean {
    return this.lecture?.contentType?.toLowerCase() === 'pdf';
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

  lastSavedTime = 0;

  onTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    const currentTime = Math.floor(video.currentTime);
    if (currentTime - this.lastSavedTime >= 10) {
      this.lastSavedTime = currentTime;
      this.updateProgress.emit(currentTime);
    }
  }

  onExternalLinkClick() {
    this.externalLinkClicked.set(true);
  }

  get canMarkComplete(): boolean {
    if (this.isCompleted) return false;
    if (!this.isVideo && !this.isPdf && !this.isTextOrMarkdown && !this.isOfficeDocument) {
      // It's an external link
      return this.externalLinkClicked();
    }
    return true; // Other types can be marked complete anytime, or handled automatically
  }

  handleMarkComplete() {
    if (!this.canMarkComplete && !this.isCompleted) return;
    this.markComplete.emit();
  }
}
