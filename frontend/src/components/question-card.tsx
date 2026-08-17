"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { LoadingMessages } from "@/components/loading-messages";
import { ProgressDots } from "@/components/progress-dots";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const MAX_ANSWER_LENGTH = 5000;

// Mirrors the backend's MIN_QUESTIONS/MAX_QUESTIONS (backend/app/routes.py) - used only to
// pick which loading messages read as more honest about what might happen next, not to
// enforce anything client-side.
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 5;

const THINKING_MESSAGES = [
  "Reading your answer...",
  "Thinking about what to ask next...",
];

const MAYBE_WRAPPING_UP_MESSAGES = [
  "Reading your answer...",
  "Deciding what to explore next...",
  "This might be one of the last few questions...",
];

const WRAPPING_UP_MESSAGES = [
  "Wrapping up the interview...",
  "Pulling together the key themes...",
  "Writing a summary...",
];

interface QuestionCardProps {
  question: string;
  questionNumber: number;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (answer: string) => void;
}

export function QuestionCard({
  question,
  questionNumber,
  submitting,
  errorMessage,
  onSubmit,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!answer.trim() || submitting) return;
    onSubmit(answer.trim());
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return;

    if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      handleSubmit(event);
      return;
    }

    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd+Enter has no default browser behavior in a textarea (unlike Shift+Enter,
      // which already inserts a newline on its own), so it's inserted manually here.
      event.preventDefault();
      const textarea = event.currentTarget;
      const { selectionStart, selectionEnd, value } = textarea;
      const nextAnswer =
        value.slice(0, selectionStart) + "\n" + value.slice(selectionEnd);
      setAnswer(nextAnswer);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      });
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="gap-4">
        <ProgressDots count={questionNumber} />
        <CardTitle className="text-2xl leading-snug font-medium">
          {question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer..."
            rows={7}
            maxLength={MAX_ANSWER_LENGTH}
            disabled={submitting}
            autoFocus
            className="text-base"
          />
          <div className="text-muted-foreground flex items-center justify-between text-sm">
            <span>Enter to submit, Ctrl+Enter for a new line</span>
            <span>
              {answer.length}/{MAX_ANSWER_LENGTH}
            </span>
          </div>
          {errorMessage && (
            <p className="text-destructive text-sm">{errorMessage}</p>
          )}
          <Button
            type="submit"
            disabled={!answer.trim() || submitting}
            className="h-11 self-end px-5 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="size-4" />
                Submit answer
              </>
            )}
          </Button>
          {submitting && (
            <LoadingMessages
              messages={
                questionNumber >= MAX_QUESTIONS
                  ? WRAPPING_UP_MESSAGES
                  : questionNumber >= MIN_QUESTIONS
                    ? MAYBE_WRAPPING_UP_MESSAGES
                    : THINKING_MESSAGES
              }
            />
          )}
        </form>
      </CardContent>
    </Card>
  );
}
