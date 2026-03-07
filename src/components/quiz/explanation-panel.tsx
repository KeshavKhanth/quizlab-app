"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown-renderer";

interface ExplanationPanelProps {
  explanation: string;
  references: string[];
  isVisible: boolean;
  imageBasePath?: string;
}

export function ExplanationPanel({
  explanation,
  references,
  isVisible,
  imageBasePath,
}: ExplanationPanelProps) {
  if (!isVisible || !explanation) return null;

  // Strip trailing reference links from the explanation text
  // (they're already shown separately in the References section)
  const cleanedExplanation = stripTrailingRefs(explanation);
  const sections = splitExplanation(cleanedExplanation);

  return (
    <Card className="border-border bg-[#F6F7F9] dark:bg-[#171615] mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <CardContent className="pt-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-foreground">
            Explanation
          </h3>
        </div>

        {/* Correct answer section */}
        {sections.correct && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3">
              <Badge
                variant="outline"
                className="text-xs font-semibold"
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.05em',
                  color: 'var(--success)',
                  backgroundColor: 'var(--success-bg)',
                  borderColor: 'var(--success-border)',
                }}
              >
                Correct Answer
              </Badge>
            </div>
            <Markdown content={sections.correct} imageBasePath={imageBasePath} />
          </div>
        )}

        {/* Main explanation body */}
        {sections.body && (
          <div>
            <Markdown content={sections.body} imageBasePath={imageBasePath} />
          </div>
        )}

        {/* Incorrect answer section */}
        {sections.incorrect && (
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="mb-3">
              <Badge
                variant="outline"
                className="text-xs font-semibold"
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  letterSpacing: '0.05em',
                  color: 'var(--error)',
                  backgroundColor: 'var(--error-bg)',
                  borderColor: 'var(--error-border)',
                }}
              >
                Incorrect Options
              </Badge>
            </div>
            <Markdown content={sections.incorrect} imageBasePath={imageBasePath} />
          </div>
        )}

        {/* References */}
        {references.length > 0 && (
          <div className="pt-1">
            <span className="text-sm font-medium text-muted-foreground">References</span>
            <ul className="mt-1.5 space-y-1">
              {references.map((ref, i) => (
                <li key={i}>
                  <a
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 underline break-all"
                  >
                    {ref}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Parse explanation text into correct / body / incorrect sections */
function splitExplanation(text: string) {
  const correctRe = /^(Correct\s+options?:\s*\n?)/im;
  const incorrectRe = /^(Incorrect\s+options?:\s*\n?)/im;

  let correct = "";
  let incorrect = "";
  let body = text;

  const cMatch = correctRe.exec(text);
  const iMatch = incorrectRe.exec(text);

  if (cMatch && iMatch) {
    if (cMatch.index < iMatch.index) {
      correct = text.slice(cMatch.index + cMatch[1].length, iMatch.index).trim();
      incorrect = text.slice(iMatch.index + iMatch[1].length).trim();
      body = text.slice(0, cMatch.index).trim();
    } else {
      incorrect = text.slice(iMatch.index + iMatch[1].length, cMatch.index).trim();
      correct = text.slice(cMatch.index + cMatch[1].length).trim();
      body = text.slice(0, iMatch.index).trim();
    }
  } else if (cMatch) {
    correct = text.slice(cMatch.index + cMatch[1].length).trim();
    body = text.slice(0, cMatch.index).trim();
  } else if (iMatch) {
    incorrect = text.slice(iMatch.index + iMatch[1].length).trim();
    body = text.slice(0, iMatch.index).trim();
  }

  // If correct section contains an embedded "Incorrect options:" subsection, split it
  if (correct) {
    const subI = incorrectRe.exec(correct);
    if (subI) {
      const correctPart = correct.slice(0, subI.index).trim();
      const incorrectPart = correct.slice(subI.index + subI[1].length).trim();
      correct = correctPart;
      incorrect = incorrectPart;
    }
  }

  return { correct, body, incorrect };
}

/** Remove trailing markdown reference links from explanation text */
function stripTrailingRefs(text: string): string {
  // Remove a trailing "References:" or "Reference:" header + link lines
  let cleaned = text.replace(
    /\n*References?:\s*\n(\s*\[?https?:\/\/[^\s)\]]+\]?\(?https?:\/\/[^\s)]*\)?\s*\n?)+$/i,
    ""
  );
  // Also remove trailing bare markdown links (pattern: [url](url) on their own lines)
  cleaned = cleaned.replace(
    /(\n\s*\[https?:\/\/[^\]]+\]\(https?:\/\/[^)]+\)\s*)+$/,
    ""
  );
  return cleaned.trimEnd();
}
