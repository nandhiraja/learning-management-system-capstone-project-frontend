import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, signal, ViewChild, ElementRef, AfterViewChecked, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
import { LectureResponse } from '../../../../../../../models/course.model';
import { environment } from '../../../../../../../../environments/environment';
import { marked } from 'marked';
import Hls from 'hls.js';
import { PdfViewerModule } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-classroom-player',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  templateUrl: './classroom-player.component.html',
  styleUrl: './classroom-player.component.css'
})
export class ClassroomPlayerComponent implements OnChanges, AfterViewChecked, OnDestroy {
  @Input({ required: true }) lecture!: LectureResponse;
  @Input() isCompleted: boolean = false;
  @Input() isCourseCompleted: boolean = false;

  @Output() videoEnded = new EventEmitter<void>();
  @Output() markComplete = new EventEmitter<void>();
  @Output() updateProgress = new EventEmitter<number>();

  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  
  private hls: Hls | null = null;
  private isVideoInitialized = false;

  // States
  protected fetchedTextContent = signal<string | null>(null);
  protected renderedMarkdownContent = signal<SafeHtml | null>(null);
  protected isFetchingText = signal<boolean>(false);
  protected externalLinkClicked = signal<boolean>(false);
  protected pdfBlobUrl = signal<string | null>(null);
  protected isFetchingPdf = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lecture'] && this.lecture) {
      this.fetchedTextContent.set(null);
      this.renderedMarkdownContent.set(null);
      this.externalLinkClicked.set(false);
      
      // Cleanup previous PDF Object URL if exists to prevent memory leaks
      if (this.pdfBlobUrl()) {
        URL.revokeObjectURL(this.pdfBlobUrl()!);
        this.pdfBlobUrl.set(null);
      }
      
      this.isVideoInitialized = false;
      this.destroyHls();
      
      if (this.isTextOrMarkdown) {
        this.fetchTextContent();
      } else if (this.isPdf) {
        this.fetchPdfContent();
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.isVideo && this.videoPlayer && !this.isVideoInitialized) {
      this.isVideoInitialized = true;
      this.initVideoPlayer();
    }
  }

  ngOnDestroy(): void {
    this.destroyHls();
  }

  private destroyHls() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }

  private initVideoPlayer() {
    const video = this.videoPlayer?.nativeElement;
    if (!video || !this.lecture) return;

    if (this.lecture.contentUrl && this.lecture.contentUrl.endsWith('.m3u8')) {
      // First, get the authorization cookie
      const authUrl = `${environment.backendUrl}/api/media/authorize?token=${this.lecture.mediaAuthToken}`;
      
      this.http.get(authUrl, { withCredentials: true }).subscribe({
        next: () => {
          if (Hls.isSupported()) {
            this.hls = new Hls({
              xhrSetup: function(xhr) {
                xhr.withCredentials = true; // Send the HttpOnly cookie with every chunk request
              }
            });
            this.hls.loadSource(this.mediaStreamUrl);
            this.hls.attachMedia(video);
          }
          else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari natively supports HLS
            video.src = this.mediaStreamUrl;
          }
        },
        error: (err) => {
          console.error("Failed to authorize media stream", err);
        }
      });
    } else {
      // Standard video loading logic (fallback for direct MP4 if any)
      video.src = this.mediaStreamUrl;
    }
  }

  get absoluteUrl(): string {
    if (!this.lecture || !this.lecture.contentUrl) return '';
    let url = this.lecture.contentUrl;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `${environment.backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  }

  get mediaStreamUrl(): string {
    if (!this.lecture || !this.lecture.contentUrl) return '';
    if (this.lecture.contentUrl.includes('/api/media/stream')) {
      return this.lecture.contentUrl;
    }
    return `${environment.backendUrl}/api/Media/stream?path=${encodeURIComponent(this.lecture.contentUrl)}`;
  }

  get mediaDocumentUrl(): string {
    if (!this.lecture || !this.lecture.contentUrl) return '';
    if (this.lecture.contentUrl.includes('/api/media/stream')) {
      return this.lecture.contentUrl;
    }
    return `${environment.backendUrl}/api/Media/document?path=${encodeURIComponent(this.lecture.contentUrl)}`;
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
    const type = this.lecture.contentType.toLowerCase();
    const url = this.lecture.contentUrl.toLowerCase();
    return type.includes('ppt') || type.includes('powerpoint') || 
           url.endsWith('.ppt') || url.endsWith('.pptx') || 
           url.endsWith('.doc') || url.endsWith('.docx') || 
           url.endsWith('.xls') || url.endsWith('.xlsx');
  }

  get googleDocsViewerUrl(): SafeResourceUrl | null {
    const url = this.absoluteUrl;
    if (!url) return null;
    const viewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }

  fetchTextContent() {
    const rawContent = this.lecture?.contentUrl;
    if (!rawContent) return;

    // Check if it's a file path or raw text
    if (rawContent.startsWith('/uploads/') || rawContent.startsWith('http') || rawContent.endsWith('.md') || rawContent.endsWith('.txt')) {
      const url = this.mediaDocumentUrl;
      this.isFetchingText.set(true);
      this.http.get(url, { responseType: 'text' }).subscribe({
        next: async (content) => {
          this.fetchedTextContent.set(content);
          try {
            const parsedHtml = await marked.parse(content);
            this.renderedMarkdownContent.set(this.sanitizer.bypassSecurityTrustHtml(parsedHtml));
          } catch (e) {
            this.renderedMarkdownContent.set(this.sanitizer.bypassSecurityTrustHtml(content));
          }
          this.isFetchingText.set(false);
        },
        error: (err) => {
          console.error('Failed to fetch text content from server', err);
          this.renderedMarkdownContent.set(this.sanitizer.bypassSecurityTrustHtml('Unable to load reading content. Please download the file or try again later.'));
          this.isFetchingText.set(false);
        }
      });
    } else {
      // It's raw markdown text stored directly in the DB
      this.fetchedTextContent.set(rawContent);
      try {
        const parsedHtml = marked.parse(rawContent) as string;
        this.renderedMarkdownContent.set(this.sanitizer.bypassSecurityTrustHtml(parsedHtml));
      } catch (e) {
        this.renderedMarkdownContent.set(this.sanitizer.bypassSecurityTrustHtml(rawContent));
      }
    }
  }

  fetchPdfContent() {
    if (!this.lecture || !this.lecture.contentUrl) return;

    this.isFetchingPdf.set(true);
    // 1. First Authorize
    const authUrl = `${environment.backendUrl}/api/media/authorize?token=${this.lecture.mediaAuthToken}`;
    
    this.http.get(authUrl, { withCredentials: true }).subscribe({
      next: () => {
        // 2. Fetch the actual PDF blob with cookies enabled
        const pdfUrl = this.mediaStreamUrl;
        this.http.get(pdfUrl, { responseType: 'blob', withCredentials: true }).subscribe({
          next: (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.pdfBlobUrl.set(objectUrl);
            this.isFetchingPdf.set(false);
          },
          error: (err) => {
            console.error('Failed to load PDF file', err);
            this.isFetchingPdf.set(false);
          }
        });
      },
      error: (err) => {
        console.error('Failed to authorize PDF stream', err);
        this.isFetchingPdf.set(false);
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
