"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuestionCard } from "./question-card";
import { OptionItem } from "./option-item";
import { ExplanationPanel } from "./explanation-panel";
import { ScoreSummary } from "./score-summary";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Question, Quiz } from "@/lib/types";
import {
  saveSession,
  loadSession,
  deleteSession,
  saveResult,
  type SavedSession,
  type QuizResult,
} from "@/lib/session-store";

interface QuizViewProps {
  quiz: Quiz;
  imageBasePath: string;
  courseId: string;
  testId: string;
  onHome: () => void;
  questionSubset?: number[];
  onFinish?: (result: QuizResult) => void;
}

/** Check if a question was answered correctly */
function isQuestionCorrect(q: Question, sel: string[]): boolean {
  const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
  return (
    sel.length === correctIds.length &&
    correctIds.every((id) => sel.includes(id))
  );
}

export function QuizView({
  quiz,
  imageBasePath,
  courseId,
  testId,
  onHome,
  questionSubset,
  onFinish,
}: QuizViewProps) {
  // All questions from the quiz (or external subset)
  const allQuestions: Question[] = useMemo(() => {
    if (questionSubset && questionSubset.length > 0) {
      return quiz.questions.filter((q) => questionSubset.includes(q.id));
    }
    return quiz.questions;
  }, [quiz, questionSubset]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [finished, setFinished] = useState(false);
  const [retryWrongIds, setRetryWrongIds] = useState<number[] | null>(null);
  const restoredRef = useRef(false);
  const sessionStartRef = useRef(new Date().toISOString());

  // ── displayQuestions is THE source of truth for everything ──
  const displayQuestions = useMemo(() => {
    if (retryWrongIds && retryWrongIds.length > 0) {
      return allQuestions.filter((q) => retryWrongIds.includes(q.id));
    }
    return allQuestions;
  }, [allQuestions, retryWrongIds]);

  const question = displayQuestions[currentIndex];
  const selected = useMemo(
    () => (question ? selections[question.id] || [] : []),
    [question, selections]
  );
  const isChecked = question ? checked.has(question.id) : false;
  const totalAnswered = checked.size;
  const progressPct =
    displayQuestions.length > 0
      ? Math.round((totalAnswered / displayQuestions.length) * 100)
      : 0;

  // ── Restore session from localStorage ──
  useEffect(() => {
    if (restoredRef.current || questionSubset) return;
    restoredRef.current = true;
    const saved = loadSession(courseId, testId);
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentIndex(Math.min(saved.currentIndex, allQuestions.length - 1));
       
      setSelections(saved.selections);
       
      setChecked(new Set(saved.checked));
      sessionStartRef.current = saved.startedAt;
    }
  }, [courseId, testId, questionSubset, allQuestions.length]);

  // ── Auto-save session (debounced) ──
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (finished || questionSubset || retryWrongIds) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const session: SavedSession = {
        courseId,
        testId,
        quizPath: "",
        currentIndex,
        selections,
        checked: Array.from(checked),
        startedAt: sessionStartRef.current,
        updatedAt: new Date().toISOString(),
      };
      saveSession(session);
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [courseId, testId, currentIndex, selections, checked, finished, questionSubset, retryWrongIds]);

  // ── Scroll to top on question change ──
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  // ── Handlers (declared before keyboard effect) ──
  const handleToggle = useCallback(
    (optionId: string) => {
      if (!question || isChecked) return;
      setSelections((prev) => {
        const current = prev[question.id] || [];
        if (question.isMultiSelect) {
          return {
            ...prev,
            [question.id]: current.includes(optionId)
              ? current.filter((id) => id !== optionId)
              : [...current, optionId],
          };
        }
        return { ...prev, [question.id]: [optionId] };
      });
    },
    [isChecked, question]
  );

  const handleCheck = useCallback(() => {
    if (!question || selected.length === 0) return;
    setChecked((prev) => new Set(prev).add(question.id));
  }, [selected, question]);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" || e.key === "n") {
        if (isChecked && currentIndex < displayQuestions.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "p") {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (e.key === "Enter" && selected.length > 0 && !isChecked) {
        handleCheck();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentIndex, isChecked, selected, displayQuestions.length, question, handleCheck]);

  // ── Score computation (uses displayQuestions) ──
  const scoreData = useMemo(() => {
    let correct = 0;
    let incorrect = 0;
    const domainBreakdown: Record<string, { correct: number; total: number }> =
      {};

    for (const q of displayQuestions) {
      const domain = q.domain || "General";
      if (!domainBreakdown[domain]) {
        domainBreakdown[domain] = { correct: 0, total: 0 };
      }
      domainBreakdown[domain].total++;

      if (checked.has(q.id)) {
        const sel = selections[q.id] || [];
        if (isQuestionCorrect(q, sel)) {
          correct++;
          domainBreakdown[domain].correct++;
        } else {
          incorrect++;
        }
      }
    }

    return {
      correct,
      incorrect,
      unanswered: displayQuestions.length - checked.size,
      domainBreakdown,
    };
  }, [displayQuestions, checked, selections]);

  const buildResult = useCallback((): QuizResult => {
    return {
      courseId,
      courseName: quiz.course,
      testId,
      testName: quiz.title,
      total: displayQuestions.length,
      correct: scoreData.correct,
      incorrect: scoreData.incorrect,
      unanswered: scoreData.unanswered,
      percentage:
        displayQuestions.length > 0
          ? Math.round((scoreData.correct / displayQuestions.length) * 100)
          : 0,
      domainBreakdown: scoreData.domainBreakdown,
      completedAt: new Date().toISOString(),
    };
  }, [courseId, testId, quiz, displayQuestions, scoreData]);

  const handleNext = useCallback(() => {
    if (currentIndex < displayQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setFinished(true);
      deleteSession(courseId, testId);
      const result = buildResult();
      saveResult(result);
      onFinish?.(result);
    }
  }, [currentIndex, displayQuestions.length, courseId, testId, buildResult, onFinish]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  // ── Retry handlers ──
  const handleRetryAll = useCallback(() => {
    setCurrentIndex(0);
    setSelections({});
    setChecked(new Set());
    setFinished(false);
    setRetryWrongIds(null);
    sessionStartRef.current = new Date().toISOString();
    deleteSession(courseId, testId);
  }, [courseId, testId]);

  const handleRetryWrong = useCallback(() => {
    const wrongIds: number[] = [];
    for (const q of displayQuestions) {
      if (checked.has(q.id)) {
        const sel = selections[q.id] || [];
        if (!isQuestionCorrect(q, sel)) wrongIds.push(q.id);
      }
    }
    if (wrongIds.length === 0) return;
    setRetryWrongIds(wrongIds);
    setCurrentIndex(0);
    setSelections({});
    setChecked(new Set());
    setFinished(false);
    sessionStartRef.current = new Date().toISOString();
    deleteSession(courseId, testId);
  }, [displayQuestions, checked, selections, courseId, testId]);

  // ── Render ──
  if (finished) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        <ScoreSummary
          total={displayQuestions.length}
          correct={scoreData.correct}
          incorrect={scoreData.incorrect}
          unanswered={scoreData.unanswered}
          domainBreakdown={scoreData.domainBreakdown}
          onRetry={handleRetryAll}
          onRetryWrong={handleRetryWrong}
          onHome={onHome}
        />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center space-y-4">
        <p className="text-muted-foreground">Question not found. The quiz data may have changed.</p>
        <Button onClick={onHome}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onHome}
          className="text-muted-foreground"
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {quiz.course} — {quiz.title}
            {retryWrongIds && (
              <span className="ml-1 text-amber-600 dark:text-amber-400">
                (Retry Wrong)
              </span>
            )}
          </span>
          <ThemeToggle />
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>
            {totalAnswered}/{displayQuestions.length} answered ({progressPct}%)
          </span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Question */}
      <Card>
        <CardContent className="pt-6">
          <QuestionCard
            question={question}
            index={currentIndex}
            total={displayQuestions.length}
            imageBasePath={imageBasePath}
          />
        </CardContent>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        {question.options.map((opt) => (
          <OptionItem
            key={opt.id}
            id={opt.id}
            text={opt.text}
            isCorrect={opt.isCorrect}
            isSelected={selected.includes(opt.id)}
            isChecked={isChecked}
            isMultiSelect={question.isMultiSelect}
            onToggle={handleToggle}
            imageBasePath={imageBasePath}
          />
        ))}
      </div>

      {/* Check / Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="flex gap-2">
          {!isChecked ? (
            <Button
              onClick={handleCheck}
              disabled={selected.length === 0}
              size="lg"
            >
              Check Answer
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg">
              {currentIndex === displayQuestions.length - 1
                ? "Finish Quiz"
                : "Next"}
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Explanation */}
      <ExplanationPanel
        explanation={question.explanation}
        references={question.references}
        isVisible={isChecked}
        imageBasePath={imageBasePath}
      />

      {/* Quick nav footer */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap pt-2 pb-8">
        {displayQuestions.map((q, i) => {
          const qSel = selections[q.id] || [];
          const qChecked = checked.has(q.id);
          let dotColor = "bg-muted";
          if (qChecked) {
            dotColor = isQuestionCorrect(q, qSel) ? "bg-success" : "bg-error";
          } else if (i === currentIndex) {
            dotColor = "bg-primary";
          }
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`w-3 h-3 rounded-full transition-all ${dotColor} ${i === currentIndex ? "scale-150 ring-2 ring-primary/30" : "hover:scale-125"
                }`}
              title={`Question ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
