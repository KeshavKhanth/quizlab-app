// ── localStorage-backed session & history store ──────────────

const SESSION_KEY = "quizapp_sessions";
const HISTORY_KEY = "quizapp_history";

// ── Types ──

export interface SavedSession {
  courseId: string;
  testId: string;
  quizPath: string;          // path to quiz.json
  currentIndex: number;
  selections: Record<number, string[]>;
  checked: number[];         // Set<number> serialised as array
  startedAt: string;         // ISO
  updatedAt: string;
}

export interface QuizResult {
  courseId: string;
  courseName: string;
  testId: string;
  testName: string;
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  domainBreakdown: Record<string, { correct: number; total: number }>;
  completedAt: string;       // ISO
}

// ── Session helpers ──

function sessionKey(courseId: string, testId: string) {
  return `${courseId}::${testId}`;
}

export function saveSession(session: SavedSession): void {
  try {
    const all = loadAllSessions();
    all[sessionKey(session.courseId, session.testId)] = {
      ...session,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(all));
  } catch {
    // quota / SSR guard
  }
}

export function loadSession(
  courseId: string,
  testId: string
): SavedSession | null {
  try {
    const all = loadAllSessions();
    return all[sessionKey(courseId, testId)] ?? null;
  } catch {
    return null;
  }
}

export function deleteSession(courseId: string, testId: string): void {
  try {
    const all = loadAllSessions();
    delete all[sessionKey(courseId, testId)];
    localStorage.setItem(SESSION_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function loadAllSessions(): Record<string, SavedSession> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// ── History helpers ──

export function saveResult(result: QuizResult): void {
  try {
    const all = loadHistory();
    all.push(result);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

export function loadHistory(): QuizResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
