import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { InstructorService } from '../../../../../../core/services/instructor.service';
import { NotificationService } from '../../../../../../shared/services/notification.service';

@Component({
  selector: 'app-instructor-quiz-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './instructor-quiz-builder.html',
  styleUrls: ['./instructor-quiz-builder.css']
})
export class InstructorQuizBuilder {
  private fb = inject(FormBuilder);
  private instructorService = inject(InstructorService);
  private notification = inject(NotificationService);

  @Input({ required: true }) lectureId!: number;
  @Input() quizId: number | null | undefined = null;
  @Output() quizSaved = new EventEmitter<void>();

  quizForm!: FormGroup;
  isSaving = false;
  isLoading = false;

  ngOnInit() {
    this.initForm();
    if (this.quizId) {
      this.loadQuiz(this.quizId);
    }
  }

  private loadQuiz(id: number) {
    this.isLoading = true;
    this.instructorService.getQuiz(id).subscribe({
      next: (quiz) => {
        this.populateForm(quiz);
        this.isLoading = false;
      },
      error: () => {
        this.notification.error('Failed to load quiz details.');
        this.isLoading = false;
      }
    });
  }

  private initForm() {
    this.quizForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      passScore: [50, [Validators.required, Validators.min(1), Validators.max(100)]],
      questions: this.fb.array([])
    });

    // Add at least one question by default if new
    if (!this.quizId) {
      this.addQuestion();
    }
  }

  get questions(): FormArray {
    return this.quizForm.get('questions') as FormArray;
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  addQuestion() {
    const questionGroup = this.fb.group({
      questionText: ['', [Validators.required, Validators.minLength(3)]],
      options: this.fb.array([])
    });
    this.questions.push(questionGroup);
    
    // Add two default options
    this.addOption(this.questions.length - 1);
    this.addOption(this.questions.length - 1);
  }

  removeQuestion(index: number) {
    if (this.questions.length > 1) {
      this.questions.removeAt(index);
    } else {
      this.notification.error('A quiz must have at least one question.');
    }
  }

  addOption(questionIndex: number) {
    const optionsArray = this.getOptions(questionIndex);
    if (optionsArray.length >= 5) {
      this.notification.error('Maximum 5 options allowed per question.');
      return;
    }
    optionsArray.push(this.fb.group({
      optionText: ['', Validators.required],
      isCorrect: [false]
    }));
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const optionsArray = this.getOptions(questionIndex);
    if (optionsArray.length > 2) {
      optionsArray.removeAt(optionIndex);
    } else {
      this.notification.error('A question must have at least two options.');
    }
  }

  setCorrectOption(questionIndex: number, optionIndex: number) {
    const optionsArray = this.getOptions(questionIndex);
    // Uncheck all other options
    for (let i = 0; i < optionsArray.length; i++) {
      optionsArray.at(i).get('isCorrect')?.setValue(i === optionIndex);
    }
  }

  private populateForm(quiz: any) {
    this.quizForm.patchValue({
      title: quiz.title,
      passScore: quiz.passScore
    });

    const questionsArray = this.quizForm.get('questions') as FormArray;
    questionsArray.clear();

    if (quiz.questions && quiz.questions.length > 0) {
      quiz.questions.forEach((q: any) => {
        const qGroup = this.fb.group({
          questionText: [q.questionText, [Validators.required, Validators.minLength(3)]],
          options: this.fb.array([])
        });

        const oArray = qGroup.get('options') as FormArray;
        q.options.forEach((o: any) => {
          oArray.push(this.fb.group({
            optionText: [o.optionText, Validators.required],
            isCorrect: [o.isCorrect]
          }));
        });

        questionsArray.push(qGroup);
      });
    } else {
      this.addQuestion();
    }
  }

  saveQuiz() {
    if (this.quizForm.invalid) {
      this.quizForm.markAllAsTouched();
      this.notification.error('Please fix form errors before saving.');
      return;
    }

    const val = this.quizForm.value;
    
    // Validate each question has exactly one correct option
    for (let i = 0; i < val.questions.length; i++) {
      const q = val.questions[i];
      const correctCount = q.options.filter((o: any) => o.isCorrect).length;
      if (correctCount !== 1) {
        this.notification.error(`Question ${i + 1} must have exactly one correct option.`);
        return;
      }
    }

    this.isSaving = true;

    if (this.quizId) {
      this.instructorService.updateQuiz(this.quizId, val).subscribe({
        next: () => {
          this.notification.success('Quiz updated successfully.');
          this.isSaving = false;
          this.quizSaved.emit();
        },
        error: (err) => {
          this.notification.error(err.error || 'Failed to update quiz.');
          this.isSaving = false;
        }
      });
    } else {
      this.instructorService.createQuiz(this.lectureId, val).subscribe({
        next: () => {
          this.notification.success('Quiz created successfully.');
          this.isSaving = false;
          this.quizSaved.emit();
        },
        error: (err) => {
          this.notification.error(err.error || 'Failed to create quiz.');
          this.isSaving = false;
        }
      });
    }
  }
}
