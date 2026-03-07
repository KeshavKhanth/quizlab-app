"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ScoreSummaryProps {
  total: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  domainBreakdown: Record<string, { correct: number; total: number }>;
  onRetry: () => void;
  onRetryWrong: () => void;
  onHome: () => void;
}

export function ScoreSummary({
  total,
  correct,
  incorrect,
  unanswered,
  domainBreakdown,
  onRetry,
  onRetryWrong,
  onHome,
}: ScoreSummaryProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const passed = pct >= 72;
  const circumference = 2 * Math.PI * 54; // r=54
  const strokeDash = (pct / 100) * circumference;

  const domainEntries = Object.entries(domainBreakdown).sort(
    ([, a], [, b]) => {
      const ap = a.total > 0 ? a.correct / a.total : 0;
      const bp = b.total > 0 ? b.correct / b.total : 0;
      return bp - ap;
    }
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Score card with circular gauge */}
      <Card className="overflow-hidden">
        <div className={`h-2 ${passed ? "bg-success" : "bg-amber-500"}`} />
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {/* Circular progress gauge */}
          <div className="flex justify-center">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="currentColor"
                  className="text-muted"
                  strokeWidth="8"
                />
                <circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  stroke="currentColor"
                  className={passed ? "text-success" : "text-amber-500"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${strokeDash} ${circumference}`}
                  style={{ transition: "stroke-dasharray 1s ease-in-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${passed ? "text-success-text" : "text-amber-600 dark:text-amber-400"}`}>
                  {pct}%
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {correct}/{total}
                </span>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-success-bg p-3">
              <div className="text-2xl font-bold text-success-text">{correct}</div>
              <div className="text-xs text-success-text">Correct</div>
            </div>
            <div className="rounded-lg bg-error-bg p-3">
              <div className="text-2xl font-bold text-error-text">{incorrect}</div>
              <div className="text-xs text-error-text">Incorrect</div>
            </div>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{unanswered}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Skipped</div>
            </div>
          </div>

          {passed ? (
            <div className="flex items-center justify-center gap-2 text-success-text font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Great job! You passed the practice test.
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Keep studying! 72% is the typical passing score.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Domain breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {domainEntries.map(([domain, stats]) => {
            const dpct =
              stats.total > 0
                ? Math.round((stats.correct / stats.total) * 100)
                : 0;
            const domainPassed = dpct >= 72;
            return (
              <div key={domain} className="space-y-1.5">
                <div className="flex justify-between text-sm gap-4">
                  <span className="font-medium truncate">{domain}</span>
                  <span className={`flex-shrink-0 font-semibold ${domainPassed ? "text-success-text" : "text-amber-600 dark:text-amber-400"}`}>
                    {stats.correct}/{stats.total} ({dpct}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${domainPassed ? "bg-success" : "bg-amber-500"}`}
                    style={{ width: `${dpct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Separator />

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onRetry} variant="default" size="lg">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry All Questions
        </Button>
        {incorrect > 0 && (
          <Button onClick={onRetryWrong} variant="outline" size="lg">
            Retry Wrong Only ({incorrect})
          </Button>
        )}
        <Button onClick={onHome} variant="ghost" size="lg">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
