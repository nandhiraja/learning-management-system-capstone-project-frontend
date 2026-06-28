import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseResponse, CourseSectionResponse, LectureResponse } from '../../../../../../models/course.model';
import { InstructorService } from '../../../../../../core/services/instructor.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';
import { BadgeChipComponent } from '../../../../../../shared/components/badge-chip/badge-chip.component';
import { HttpEventType } from '@angular/common/http';

@Component({
  selector: 'app-course-curriculum',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BadgeChipComponent],
  templateUrl: './course-curriculum.component.html',
  styleUrl: './course-curriculum.component.css'
})
export class CourseCurriculumComponent {
  private fb = inject(FormBuilder);
  private instructorService = inject(InstructorService);
  private notification = inject(NotificationService);

  @Input({ required: true }) course: CourseResponse | null = null;
  @Output() refresh = new EventEmitter<void>();

  // Section Accordion State: stores IDs of expanded sections
  protected expandedSections = new Set<number>();

  // Inline Section Add/Edit Form State
  protected isAddingSection = signal<boolean>(false);
  protected newSectionTitle = signal<string>('');
  protected editingSectionId = signal<number | null>(null);
  protected editingSectionTitle = signal<string>('');

  // Lecture Modal Overlay State
  protected isLectureModalOpen = signal<boolean>(false);
  protected lectureForm!: FormGroup;
  protected targetSectionId = signal<number | null>(null);
  protected editingLectureId = signal<number | null>(null);
  
  // File upload state within lecture modal
  protected isUploadingFile = signal<boolean>(false);
  protected fileUploadProgress = signal<number>(0);
  protected uploadedFileUrl = signal<string | null>(null);

  constructor() {
    this.initLectureForm();
  }

  // --- Accordion Controls ---
  protected toggleSection(sectionId: number) {
    if (this.expandedSections.has(sectionId)) {
      this.expandedSections.delete(sectionId);
    } else {
      this.expandedSections.add(sectionId);
    }
  }

  protected isSectionExpanded(sectionId: number): boolean {
    // Default expand the first section if not interacted with
    if (this.course?.sections && this.course.sections.length > 0 && this.expandedSections.size === 0) {
      this.expandedSections.add(this.course.sections[0].id);
    }
    return this.expandedSections.has(sectionId);
  }

  // --- Section Management Operations ---
  protected startAddSection() {
    this.isAddingSection.set(true);
    this.newSectionTitle.set('');
  }

  protected cancelAddSection() {
    this.isAddingSection.set(false);
  }

  protected saveSection() {
    const title = this.newSectionTitle().trim();
    if (!title || !this.course) return;

    // Calculate order based on current sections length
    const order = (this.course.sections?.length || 0) + 1;

    this.instructorService.createSection(this.course.externalId, { title, order }).subscribe({
      next: () => {
        this.notification.success('Section added successfully!');
        this.isAddingSection.set(false);
        this.refresh.emit();
      },
      error: (err) => this.notification.error(err.error || 'Failed to add section.')
    });
  }

  protected startEditSection(section: CourseSectionResponse) {
    this.editingSectionId.set(section.id);
    this.editingSectionTitle.set(section.title);
  }

  protected cancelEditSection() {
    this.editingSectionId.set(null);
  }

  protected updateSection(section: CourseSectionResponse) {
    const title = this.editingSectionTitle().trim();
    if (!title) return;

    this.instructorService.updateSection(section.id, { title, order: section.order }).subscribe({
      next: () => {
        this.notification.success('Section renamed.');
        this.editingSectionId.set(null);
        this.refresh.emit();
      },
      error: (err) => this.notification.error(err.error || 'Failed to update section.')
    });
  }

  protected deleteSection(sectionId: number) {
    if (confirm('Are you sure you want to delete this section? All lectures inside it will be permanently deleted.')) {
      this.instructorService.deleteSection(sectionId).subscribe({
        next: () => {
          this.notification.success('Section deleted successfully.');
          this.refresh.emit();
        },
        error: (err) => this.notification.error(err.error || 'Failed to delete section.')
      });
    }
  }

  // --- Lecture Modal Form controls ---
  private initLectureForm() {
    this.lectureForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      contentType: ['Video', [Validators.required]],
      durationInMinutes: [10, [Validators.required, Validators.min(1), Validators.max(10000)]],
      contentUrl: ['', [Validators.required]]
    });

    // Reset upload status when type changes
    this.lectureForm.get('contentType')?.valueChanges.subscribe(() => {
      this.uploadedFileUrl.set(null);
      this.lectureForm.get('contentUrl')?.setValue('');
    });
  }

  protected openAddLectureModal(sectionId: number) {
    this.targetSectionId.set(sectionId);
    this.editingLectureId.set(null);
    this.lectureForm.reset({
      title: '',
      contentType: 'Video',
      durationInMinutes: 10,
      contentUrl: ''
    });
    this.uploadedFileUrl.set(null);
    this.isLectureModalOpen.set(true);
  }

  protected openEditLectureModal(sectionId: number, lecture: LectureResponse) {
    this.targetSectionId.set(sectionId);
    this.editingLectureId.set(lecture.id);
    this.lectureForm.patchValue({
      title: lecture.title,
      contentType: lecture.contentType,
      durationInMinutes: lecture.durationInMinutes,
      contentUrl: lecture.contentUrl
    });
    this.uploadedFileUrl.set(lecture.contentUrl);
    this.isLectureModalOpen.set(true);
  }

  protected closeLectureModal() {
    this.isLectureModalOpen.set(false);
    this.targetSectionId.set(null);
    this.editingLectureId.set(null);
  }

  // --- Lecture File Upload Handlers ---
  protected onLectureFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const type = this.lectureForm.get('contentType')?.value;

    let uploadType: 'video' | 'pdf' | null = null;
    if (type === 'Video') {
      if (!file.type.startsWith('video/')) {
        this.notification.error('Please upload a valid video file (.mp4, .mov, etc.).');
        return;
      }
      // 200MB video limit
      if (file.size > 200 * 1024 * 1024) {
        this.notification.error('Video size exceeds the 200MB limit.');
        return;
      }
      uploadType = 'video';
    } else if (type === 'pdf') {
      if (file.type !== 'application/pdf') {
        this.notification.error('Please select a valid PDF document.');
        return;
      }
      // 20MB pdf limit
      if (file.size > 20 * 1024 * 1024) {
        this.notification.error('PDF file size exceeds 20MB limit.');
        return;
      }
      uploadType = 'pdf';
    }

    if (!uploadType) return;

    this.isUploadingFile.set(true);
    this.fileUploadProgress.set(0);

    this.instructorService.uploadFile(file, uploadType).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.fileUploadProgress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response) {
          const body = event.body;
          if (body && body.url) {
            this.uploadedFileUrl.set(body.url);
            this.lectureForm.get('contentUrl')?.setValue(body.url);
            this.notification.success('Resource file uploaded successfully!');
          }
          this.isUploadingFile.set(false);
        }
      },
      error: (err) => {
        this.notification.error(err.error || 'Failed to upload resource file.');
        this.isUploadingFile.set(false);
      }
    });
  }

  // --- Save / Update Lecture ---
  protected saveLecture() {
    if (this.lectureForm.invalid) {
      this.lectureForm.markAllAsTouched();
      return;
    }

    const payload = this.lectureForm.value;
    const lectureId = this.editingLectureId();
    const sectionId = this.targetSectionId();

    if (lectureId) {
      // Edit mode
      this.instructorService.updateLecture(lectureId, payload).subscribe({
        next: () => {
          this.notification.success('Lecture updated successfully.');
          this.closeLectureModal();
          this.refresh.emit();
        },
        error: (err) => this.notification.error(err.error || 'Failed to update lecture.')
      });
    } else if (sectionId) {
      // Create mode
      this.instructorService.createLecture(sectionId, payload).subscribe({
        next: () => {
          this.notification.success('Lecture added successfully.');
          this.closeLectureModal();
          this.refresh.emit();
        },
        error: (err) => this.notification.error(err.error || 'Failed to add lecture.')
      });
    }
  }

  protected deleteLecture(lectureId: number) {
    if (confirm('Are you sure you want to delete this lecture?')) {
      this.instructorService.deleteLecture(lectureId).subscribe({
        next: () => {
          this.notification.success('Lecture deleted.');
          this.refresh.emit();
        },
        error: (err) => this.notification.error(err.error || 'Failed to delete lecture.')
      });
    }
  }
}
