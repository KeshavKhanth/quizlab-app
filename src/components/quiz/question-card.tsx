"use client";

import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/markdown-renderer";
import type { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  imageBasePath?: string;
}

export function QuestionCard({
  question,
  index,
  total,
  imageBasePath,
}: QuestionCardProps) {
  // Generate a consistent color based on domain string hash
  const domainColorSets = [
    "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800",
    "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-800",
    "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800",
    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800",
  ];

  const getDomainColor = (domain: string) => {
    let hash = 0;
    for (let i = 0; i < domain.length; i++) {
      hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
    }
    return domainColorSets[Math.abs(hash) % domainColorSets.length];
  };

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-semibold text-foreground" style={{ fontFamily: 'var(--font-display, inherit)', letterSpacing: '0.02em' }}>
            Question <span className="text-primary">{index + 1}</span>
          </span>
          <span className="text-xs font-medium text-muted-foreground/70 tabular-nums">
            of {total}
          </span>
        </div>
        {question.isMultiSelect && (
          <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary" style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.02em' }}>
            Select multiple
          </Badge>
        )}
      </div>

      {/* Domain badge */}
      {question.domain && (
        <Badge
          variant="outline"
          className={`text-xs font-medium ${getDomainColor(question.domain)}`}
          style={{ fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.02em' }}
        >
          {question.domain}
        </Badge>
      )}

      {/* Question prompt */}
      <div className="pt-1">
        <Markdown content={question.prompt} imageBasePath={imageBasePath} />
      </div>
    </div>
  );
}
