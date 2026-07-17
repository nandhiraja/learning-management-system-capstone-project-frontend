export interface QuizResponse {
  id: number;
  title: string;
  passScore: number;
  questions: QuizQuestionResponse[];
}

export interface QuizQuestionResponse {
  id: number;
  questionText: string;
  options: QuizOptionResponse[];
}

export interface QuizOptionResponse {
  id: number;
  optionText: string;
  isCorrect?: boolean;
}

export interface QuizSubmitRequest {
  answers: QuizSubmitAnswer[];
}

export interface QuizSubmitAnswer {
  questionId: number;
  optionId: number;
}

export interface QuizSubmitResponse {
  score: number;
  passed: boolean;
}

export interface QuizProgressResponse {
  quizId: number;
  attemptsUsed: number;
  maxAttempts: number;
  highestScore: number;
  passScore: number;
  isPassed: boolean;
  lastStudyPlan?: string;
}
