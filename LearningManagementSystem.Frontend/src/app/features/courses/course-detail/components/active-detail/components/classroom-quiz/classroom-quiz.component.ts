import { Component, Input, Output, EventEmitter, inject, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../../../../../../core/services/quiz.service';
import { NotificationService } from '../../../../../../../shared/services/notification.service';
import { QuizResponse, QuizSubmitResponse } from '../../../../../../../models/quiz.model';
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

  // States
  protected activeQuiz = signal<QuizResponse | null>(null);
  protected isLoadingQuiz = signal<boolean>(false);
  protected quizAnswers = signal<Record<number, number>>({}); // questionId -> optionId
  protected quizResult = signal<QuizSubmitResponse | null>(null);
  protected isSubmittingQuiz = signal<boolean>(false);

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
  }

  loadQuiz(quizId: number) {
    this.isLoadingQuiz.set(true);
    this.quizService.getQuiz(quizId).subscribe({
      next: (data) => {
        this.activeQuiz.set(data);
        this.isLoadingQuiz.set(false);
      },
      error: (err) => {
        console.error('Failed to load quiz details', err);
        this.isLoadingQuiz.set(false);
      }
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
        } else {
          this.notification.warning(`You scored ${result.score}%. Try again to meet the passing score of ${quiz.passScore}%.`);
        }
      },
      error: (err) => {
        this.notification.error('Failed to submit quiz.');
        this.isSubmittingQuiz.set(false);
      }
    });
  }

  resetQuiz() {
    this.quizResult.set(null);
    this.quizAnswers.set({});
  }
}
