"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuizView } from "@/components/quiz/quiz-view";
import {
  loadAllSessions,
  loadHistory,
  clearHistory,
  deleteSession,
  type QuizResult,
} from "@/lib/session-store";
import type { Manifest, Course, TestInfo, Quiz } from "@/lib/types";
import { DATA_BASE_URL } from "@/lib/config";

type View =
  | { kind: "home" }
  | { kind: "quiz"; courseId: string; testId: string; quiz: Quiz; basePath: string };

/* ── Horizontal scroll carousel ─────────────────────────────── */
function TestCarousel({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 0);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    check();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", check); ro.disconnect(); };
  }, [check]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <div className="relative group">
      {/* Left arrow */}
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-8 h-8 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors sm:opacity-0 sm:group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
      )}
      {/* Right arrow */}
      {canRight && (
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-8 h-8 rounded-full bg-card border shadow-md flex items-center justify-center hover:bg-accent transition-colors sm:opacity-0 sm:group-hover:opacity-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      )}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [view, setView] = useState<View>({ kind: "home" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QuizResult[]>([]);
  const [sessions, setSessions] = useState<Record<string, unknown>>({});

  // Load manifest, history, and sessions
  useEffect(() => {
    fetch(`${DATA_BASE_URL}/manifest.json`)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load manifest");
        return r.json();
      })
      .then((data: Manifest) => setManifest(data))
      .catch((e: Error) => setError(e.message));

    setHistory(loadHistory());
    setSessions(loadAllSessions());
  }, []);

  // Refresh when returning home
  useEffect(() => {
    if (view.kind === "home") {
      setHistory(loadHistory());
      setSessions(loadAllSessions());
    }
  }, [view]);

  const hasSession = (courseId: string, testId: string) => {
    return `${courseId}::${testId}` in sessions;
  };

  const startQuiz = async (course: Course, test: TestInfo) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${DATA_BASE_URL}/${test.path}`);
      if (!res.ok) throw new Error("Could not load quiz data");
      const quiz: Quiz = await res.json();
      const basePath = `${DATA_BASE_URL}/${test.path.replace("/quiz.json", "")}`;
      setView({
        kind: "quiz",
        courseId: course.id,
        testId: test.id,
        quiz,
        basePath,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error loading quiz");
    } finally {
      setLoading(false);
    }
  };

  const resetSession = (courseId: string, testId: string) => {
    deleteSession(courseId, testId);
    setSessions(loadAllSessions());
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  // Latest results per test
  const latestByTest = history.reduce<Record<string, QuizResult>>(
    (acc, r) => {
      const key = `${r.courseId}::${r.testId}`;
      if (!acc[key] || r.completedAt > acc[key].completedAt) {
        acc[key] = r;
      }
      return acc;
    },
    {}
  );

  if (view.kind === "quiz") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <QuizView
            quiz={view.quiz}
            imageBasePath={view.basePath}
            courseId={view.courseId}
            testId={view.testId}
            onHome={() => setView({ kind: "home" })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">QuizLab</h1>
                <p className="text-sm text-muted-foreground">
                  Interactive practice tests for technical certifications
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Error */}
        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {!manifest && !error && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-muted border-t-primary rounded-full" />
          </div>
        )}

        {/* ── Courses — one row per course ── */}
        {manifest?.courses.map((course) => (
          <section key={course.id}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-foreground">{course.name}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {course.tests.length} practice test{course.tests.length !== 1 ? "s" : ""} available
              </p>
            </div>
            <TestCarousel>
              {course.tests.map((test) => {
                const latestKey = `${course.id}::${test.id}`;
                const latest = latestByTest[latestKey];
                const inProgress = hasSession(course.id, test.id);
                return (
                  <Card
                    key={test.id}
                    className="w-[340px] flex-shrink-0 snap-start group hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{test.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {test.totalQuestions} Qs
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 min-h-[140px]">
                      <p className="text-sm text-muted-foreground">
                        {test.totalQuestions} questions covering all domains
                      </p>

                      {/* Last attempt badge - reserve space to keep consistent height */}
                      <div className="min-h-[20px]">
                        {latest && (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge
                              variant="outline"
                              className={
                                latest.percentage >= 72
                                  ? "border-success-border text-success-text"
                                  : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                              }
                            >
                              Last: {latest.percentage}%
                            </Badge>
                            <span className="text-muted-foreground">
                              {new Date(latest.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          disabled={loading}
                          onClick={() => startQuiz(course, test)}
                        >
                          {inProgress ? "Resume" : "Start Practice"}
                        </Button>
                        {inProgress && (
                          <Button
                            variant="outline"
                            size="icon"
                            title="Reset progress"
                            onClick={() => resetSession(course.id, test.id)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TestCarousel>
          </section>
        ))}

        {/* ── Result History ── */}
        {history.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Result History</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs"
                onClick={handleClearHistory}
              >
                Clear All
              </Button>
            </div>
            <Card>
              <CardContent className="pt-4 divide-y divide-border">
                {[...history].reverse().slice(0, 10).map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">{r.testName}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.courseName} · {new Date(r.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${r.percentage >= 72 ? "text-success-text" : "text-amber-600 dark:text-amber-400"}`}>
                        {r.percentage}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.correct}/{r.total}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

      </main>

      <footer className="border-t bg-card mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          Built for self-study · Developed by Keshav · Keyboard shortcuts: ← → navigate, Enter to check
        </div>
      </footer>
    </div>
  );
}
