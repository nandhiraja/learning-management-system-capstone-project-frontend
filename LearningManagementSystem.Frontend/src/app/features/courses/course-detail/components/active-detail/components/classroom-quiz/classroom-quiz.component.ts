import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { QuizService } from '../../../../../../../core/services/quiz.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { AiService } from '../../../../../../../core/services/ai.service';
import { QuizProgressResponse, QuizResponse, QuizSubmitResponse } from '../../../../../../../models/quiz.model';
import { LectureResponse } from '../../../../../../../models/course.model';

@Component({
  selector: 'app-classroom-quiz',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './classroom-quiz.component.html',
  styleUrl: './classroom-quiz.component.css'
})
export class ClassroomQuizComponent implements OnChanges {
  @Input({ required: true }) quizId!: number;
  @Input({ required: true }) activeLecture: LectureResponse | null = null;

  @Output() quizPassed = new EventEmitter<void>();

  private quizService = inject(QuizService);
  private notification = inject(NotificationService);
  private aiService = inject(AiService);
  private sanitizer = inject(DomSanitizer);

  // States
  protected activeQuiz = signal<QuizResponse | null>(null);
  protected isLoadingQuiz = signal<boolean>(false);
  protected quizAnswers = signal<Record<number, number>>({}); // questionId -> optionId
  protected quizResult = signal<QuizSubmitResponse | null>(null);
  protected isSubmittingQuiz = signal<boolean>(false);
  protected quizProgress = signal<QuizProgressResponse | null>(null);
  protected latestStudyPlan = signal<string | null>(null);
  protected isGeneratingStudyPlan = signal<boolean>(false);

  protected getCoachingMode = computed(() => {
    const progress = this.quizProgress();
    if (!progress) return { label: 'Coaching Mode', badgeClass: 'early', desc: 'Conceptual hints only' };
    const remaining = progress.maxAttempts - progress.attemptsUsed;
    if (remaining > 1) {
      return { label: 'Hint Coach', badgeClass: 'early', desc: 'Conceptual hints only' };
    } else if (remaining === 1) {
      return { label: 'Deep Guide', badgeClass: 'middle', desc: 'Detailed guidance & analogies' };
    } else {
      return { label: 'Full Remediation', badgeClass: 'final', desc: 'Complete answers & explanations' };
    }
  });

  protected renderedStudyPlan = computed<SafeHtml | null>(() => {
    const raw = this.latestStudyPlan();
    if (!raw) return null;
    try {
      console.log('[ClassroomQuiz] Raw study plan length:', raw.length);
      const parsed = marked.parse(raw);
      console.log('[ClassroomQuiz] Parsed result type:', typeof parsed, parsed instanceof Promise ? 'Promise' : 'String');
      
      // If it returned a Promise, we must handle it (should not happen synchronously)
      if (parsed instanceof Promise) {
        console.warn('[ClassroomQuiz] marked.parse returned a Promise!');
        return this.sanitizer.bypassSecurityTrustHtml(raw);
      }
      
      return this.sanitizer.bypassSecurityTrustHtml(parsed as string);
    } catch (err) {
      console.error('[ClassroomQuiz] Error parsing markdown with marked:', err);
      return this.sanitizer.bypassSecurityTrustHtml(raw);
    }
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['quizId'] && this.quizId) {
      this.resetQuizState();
      this.loadQuiz(this.quizId);
    }
  }

  private resetQuizState() {
    this.activeQuiz.set(null);
    this.quizAnswers.set({});
    this.quizResult.set(null);
    this.isSubmittingQuiz.set(false);
    this.quizProgress.set(null);
    this.latestStudyPlan.set(null);
    this.isGeneratingStudyPlan.set(false);
  }

  loadQuiz(quizId: number) {
    this.isLoadingQuiz.set(true);
    
    // Load progress and quiz in parallel
    Promise.all([
      new Promise<void>(resolve => {
        this.quizService.getQuiz(quizId).subscribe({
          next: (data) => {
            this.activeQuiz.set(data);
            resolve();
          },
          error: (err) => {
            console.error('Failed to load quiz details', err);
            resolve();
          }
        });
      }),
      new Promise<void>(resolve => {
        this.quizService.getQuizProgress(quizId).subscribe({
          next: (data) => {
            this.quizProgress.set(data);
            if (data?.lastStudyPlan) {
              this.latestStudyPlan.set(data.lastStudyPlan);
            }
            resolve();
          },
          error: (err) => {
            console.error('Failed to load quiz progress', err);
            resolve();
          }
        });
      })
    ]).finally(() => {
      this.isLoadingQuiz.set(false);
    });
  }

  selectOption(questionId: number, optionId: number) {
    this.quizAnswers.update(answers => ({
      ...answers,
      [questionId]: optionId
    }));
  }

  submitQuiz() {
    const quiz = this.activeQuiz();
    if (!quiz) return;

    // Check if all questions are answered
    const answersObj = this.quizAnswers();
    const unanswered = quiz.questions.filter(q => !answersObj[q.id]);
    
    if (unanswered.length > 0) {
      this.notification.warning(`Please answer all ${quiz.questions.length} questions before submitting.`);
      return;
    }

    this.isSubmittingQuiz.set(true);
    const answersList = Object.keys(answersObj).map(key => ({
      questionId: Number(key),
      optionId: answersObj[Number(key)]
    }));

    this.quizService.submitQuiz(quiz.id, { answers: answersList }).subscribe({
      next: (result) => {
        this.quizResult.set(result);
        this.isSubmittingQuiz.set(false);
        if (result.passed) {
          this.notification.success(`Congratulations! You passed the quiz with a score of ${result.score}%!`);
          this.quizPassed.emit();
          this.latestStudyPlan.set(null);
        } else {
          this.notification.warning(`You scored ${result.score}%. Try again to meet the passing score of ${quiz.passScore}%.`);
          
          // Trigger AI Study Plan generation
          this.isGeneratingStudyPlan.set(true);
          this.aiService.generateStudyPlan(quiz.id, answersList).subscribe({
            next: (res) => {
              this.latestStudyPlan.set(res.studyPlan);
              this.isGeneratingStudyPlan.set(false);
            },
            error: (err) => {
              console.error('Failed to generate study plan', err);
              this.isGeneratingStudyPlan.set(false);
            }
          });
        }
        
        // Reload progress to update attempts and status
        this.loadProgressOnly(quiz.id);
      },
      error: (err) => {
        this.notification.error('Failed to submit quiz.');
        this.isSubmittingQuiz.set(false);
      }
    });
  }

  private loadProgressOnly(quizId: number) {
    this.quizService.getQuizProgress(quizId).subscribe({
      next: (data) => {
        this.quizProgress.set(data);
        if (data?.lastStudyPlan) {
          this.latestStudyPlan.set(data.lastStudyPlan);
        }
      }
    });
  }

  resetQuiz() {
    this.quizResult.set(null);
    this.quizAnswers.set({});
  }
}
