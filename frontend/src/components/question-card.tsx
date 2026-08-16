"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

import { ProgressDots } from "@/components/progress-dots";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

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

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <ProgressDots count={questionNumber} />
        <CardTitle className="text-lg leading-snug font-medium">{question}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Type your answer..."
            rows={5}
            disabled={submitting}
            autoFocus
          />
          {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
          <Button type="submit" disabled={!answer.trim() || submitting} className="self-end">
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
