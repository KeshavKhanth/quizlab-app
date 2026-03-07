// ── Quiz data types ──────────────────────────────────────────

export interface Manifest {
  courses: Course[];
}

export interface Course {
  id: string;
  name: string;
  tests: TestInfo[];
}

export interface TestInfo {
  id: string;
  name: string;
  totalQuestions: number;
  path: string;
}

export interface Quiz {
  id: string;
  title: string;
  course: string;
  totalQuestions: number;
  questions: Question[];
}

export interface Question {
  id: number;
  domain: string;
  prompt: string;
  isMultiSelect: boolean;
  options: Option[];
  explanation: string;
  references: string[];
}

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

// ── Quiz session state ───────────────────────────────────────

export interface QuizSession {
  quiz: Quiz;
  currentIndex: number;
  answers: Record<number, string[]>; // questionId → selected option ids
  checked: Set<number>; // questionIds already checked
  correct: number;
  incorrect: number;
  finished: boolean;
}
