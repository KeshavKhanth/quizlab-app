"use client";

import { cn } from "@/lib/utils";
import { Markdown } from "@/components/markdown-renderer";

interface OptionItemProps {
  id: string;
  text: string;
  isCorrect: boolean;
  isSelected: boolean;
  isChecked: boolean;
  isMultiSelect: boolean;
  onToggle: (id: string) => void;
  imageBasePath?: string;
}

export function OptionItem({
  id,
  text,
  isCorrect,
  isSelected,
  isChecked,
  isMultiSelect,
  onToggle,
  imageBasePath,
}: OptionItemProps) {
  const handleClick = () => {
    if (!isChecked) onToggle(id);
  };

  // Determine visual state
  let borderColor = "border-border hover:border-primary/50";
  let bgColor = "bg-card";
  let ringStyle = "";

  if (isChecked) {
    if (isCorrect) {
      borderColor = "border-success-border";
      bgColor = "bg-success-bg";
    } else if (isSelected) {
      borderColor = "border-error-border";
      bgColor = "bg-error-bg";
    } else {
      borderColor = "border-border";
      bgColor = "bg-card";
    }
  } else if (isSelected) {
    borderColor = "border-primary";
    bgColor = "bg-primary/5";
    ringStyle = "ring-2 ring-primary/20";
  }

  // Process text – strip leading paragraph markers
  let cleanText = text.trim();
  if (imageBasePath) {
    cleanText = cleanText.replace(
      /!\[image\]\(images\//g,
      `![image](${imageBasePath}/images/`
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isChecked}
      className={cn(
        "w-full text-left rounded-lg border-2 p-4 transition-all duration-200",
        borderColor,
        bgColor,
        ringStyle,
        !isChecked && "cursor-pointer hover:shadow-sm",
        isChecked && "cursor-default"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection indicator */}
        <div className="mt-0.5 flex-shrink-0">
          {isChecked ? (
            isCorrect ? (
              <div className="w-6 h-6 rounded-full bg-success flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : isSelected ? (
              <div className="w-6 h-6 rounded-full bg-error flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30" />
            )
          ) : (
            <div
              className={cn(
                "w-6 h-6 flex items-center justify-center border-2 transition-colors",
                isMultiSelect ? "rounded" : "rounded-full",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40"
              )}
            >
              {isSelected && (
                isMultiSelect ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-current" />
                )
              )}
            </div>
          )}
        </div>

        {/* Option label + text */}
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-semibold mr-2 flex-shrink-0 tabular-nums tracking-tight",
              isChecked && isCorrect
                ? "bg-success-bg text-success-text"
                : isChecked && isSelected
                  ? "bg-error-bg text-error-text"
                  : isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
            )}
          >
            {id}
          </span>
          <div className="text-[0.9375rem] leading-[1.65] tracking-[-0.008em] flex-1 min-w-0 [&_pre]:my-2 [&_pre]:text-xs [&_code]:text-xs">
            <Markdown content={cleanText} />
          </div>
        </div>
      </div>
    </button>
  );
}
