"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { ProgressDots } from "@/components/progress-dots";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const MAX_ANSWER_LENGTH = 5000;

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
      <CardHeader>
        <ProgressDots count={questionNumber} />
        <CardTitle className="text-xl leading-snug font-medium">
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
          <div className="text-muted-foreground flex items-center justify-between text-xs">
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
            className="self-end"
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
        </form>
      </CardContent>
    </Card>
  );
}
