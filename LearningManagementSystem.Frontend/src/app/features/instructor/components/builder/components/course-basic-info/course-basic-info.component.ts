import { Component, Input, Output, EventEmitter, OnInit, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseResponse, Category, Language } from '../../../../../../models/course.model';
import { InstructorService } from '../../../../../../core/services/instructor.service';
import { CourseService } from '../../../../../../core/services/course.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-course-basic-info',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-basic-info.component.html',
  styleUrl: './course-basic-info.component.css'
})
export class CourseBasicInfoComponent implements OnInit, OnChanges {
  private fb = inject(FormBuilder);
  private instructorService = inject(InstructorService);
  private courseService = inject(CourseService);
  private notification = inject(NotificationService);

  @Input() course: CourseResponse | null = null;
  @Output() saved = new EventEmitter<CourseResponse>();

  // Basic Form Group
  protected infoForm!: FormGroup;
  protected categories = signal<Category[]>([]);
  protected languages = signal<Language[]>([]);
  
  // File Upload states
  protected isDragging = signal<boolean>(false);
  protected isUploading = signal<boolean>(false);
  protected uploadProgress = signal<number>(0);
  protected thumbnailUrl = signal<string | null>(null);
  protected isSubmitting = signal<boolean>(false);

  constructor() {
    this.initForm();
  }

  ngOnInit() {
    this.loadMetadata();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['course'] && this.course) {
      this.populateForm();
    }
  }

  private initForm() {
    this.infoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      categoryId: ['', [Validators.required]],
      language: ['', [Validators.required, Validators.maxLength(50)]],
      price: [0, [Validators.required, Validators.min(0), Validators.max(100000)]],
      isFree: [true]
    });

    // Listen to isFree status changes
    this.infoForm.get('isFree')?.valueChanges.subscribe(isFree => {
      const priceControl = this.infoForm.get('price');
      if (isFree) {
        priceControl?.setValue(0);
        priceControl?.disable();
      } else {
        priceControl?.enable();
        if (priceControl?.value === 0) {
          priceControl?.setValue(9.99);
        }
      }
    });
  }

  private populateForm() {
    if (!this.course) return;
    
    this.infoForm.patchValue({
      title: this.course.title,
      description: this.course.description,
      categoryId: this.course.categoryId,
      language: this.course.language,
      price: this.course.price,
      isFree: this.course.price === 0
    });

    if (this.course.price === 0) {
      this.infoForm.get('price')?.disable();
    } else {
      this.infoForm.get('price')?.enable();
    }

    this.thumbnailUrl.set(this.course.thumbnailUrl);
  }

  private loadMetadata() {
    // Load approved categories
    this.courseService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.notification.error('Failed to load categories catalog.')
    });

    // Load languages list
    this.courseService.getLanguages().subscribe({
      next: (data) => this.languages.set(data),
      error: () => this.notification.error('Failed to load languages list.')
    });
  }

  // --- Image Upload Handlers ---
  protected onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave() {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleImageFile(files[0]);
    }
  }

  protected onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleImageFile(input.files[0]);
    }
  }

  private handleImageFile(file: File) {
    // Validate type (image)
    if (!file.type.startsWith('image/')) {
      this.notification.error('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.notification.error('Image size exceeds the 5MB limit.');
      return;
    }

    this.isUploading.set(true);
    this.uploadProgress.set(0);

    this.instructorService.uploadFile(file, 'image').subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response) {
          const body = event.body;
          if (body && body.url) {
            this.thumbnailUrl.set(body.url);
            this.notification.success('Thumbnail uploaded successfully!');
          }
          this.isUploading.set(false);
        }
      },
      error: (err) => {
        this.notification.error(err.error || 'Failed to upload thumbnail image.');
        this.isUploading.set(false);
      }
    });
  }

  protected removeThumbnail() {
    this.thumbnailUrl.set(null);
  }

  // --- Form Submit ---
  protected onSubmit() {
    if (this.infoForm.invalid || this.isSubmitting()) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    // Ensure we retrieve price even if disabled
    const formValues = this.infoForm.getRawValue();
    const payload = {
      title: formValues.title,
      description: formValues.description,
      categoryId: parseInt(formValues.categoryId, 10),
      language: formValues.language,
      price: formValues.isFree ? 0 : formValues.price,
      thumbnailUrl: this.thumbnailUrl()
    };

    if (this.course) {
      // Update Mode
      this.instructorService.updateCourse(this.course.externalId, payload).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          const updated: CourseResponse = {
            ...this.course!,
            title: payload.title,
            description: payload.description,
            categoryId: payload.categoryId,
            language: payload.language,
            price: payload.price,
            thumbnailUrl: payload.thumbnailUrl
          };
          this.saved.emit(updated);
        },
        error: (err) => {
          this.notification.error(err.error || 'Failed to update course info.');
          this.isSubmitting.set(false);
        }
      });
    } else {
      // Create Mode
      this.instructorService.createCourse(payload).subscribe({
        next: (created) => {
          this.isSubmitting.set(false);
          this.saved.emit(created);
        },
        error: (err) => {
          this.notification.error(err.error || 'Failed to create course.');
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
