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
