"use client";

import { motion } from "motion/react";
import { useState } from "react";

import { BackendWakeupBanner } from "@/components/backend-wakeup-banner";
import { QuestionCard } from "@/components/question-card";
import { RecentInterviews } from "@/components/recent-interviews";
import { ResultCard } from "@/components/result-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { TopicSuggestions } from "@/components/topic-suggestions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import {
  ApiError,
  startInterview,
  submitAnswer,
  type InterviewResult,
} from "@/lib/api";

type Screen =
  | { kind: "landing" }
  | {
      kind: "interview";
      sessionId: string;
      topic: string;
      question: string;
      questionNumber: number;
    }
  | { kind: "result"; topic: string; result: InterviewResult };

const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

export default function Home() {
  const backendStatus = useBackendHealth();

  const [screen, setScreen] = useState<Screen>({ kind: "landing" });
  const [topic, setTopic] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleStart() {
    if (!topic.trim() || starting) return;
    setStarting(true);
    setStartError(null);
    try {
      const response = await startInterview(topic.trim());
      if (response.status === "declined") {
        setStartError(
          response.message ?? "That topic isn't a good fit for an interview.",
        );
        return;
      }
      setScreen({
        kind: "interview",
        sessionId: response.session_id!,
        topic: topic.trim(),
        question: response.question!,
        questionNumber: 1,
      });
    } catch (error) {
      setStartError(
        error instanceof ApiError ? error.message : "Something went wrong.",
      );
    } finally {
      setStarting(false);
    }
  }

  async function handleAnswer(answer: string) {
    if (screen.kind !== "interview" || submitting) return;
    setSubmitting(true);
    setAnswerError(null);
    try {
      const response = await submitAnswer(screen.sessionId, answer);
      if (response.status === "completed" && response.result) {
        setScreen({
          kind: "result",
          topic: screen.topic,
          result: response.result,
        });
        setRefreshKey((key) => key + 1);
      } else if (response.question) {
        setScreen({
          ...screen,
          question: response.question,
          questionNumber: screen.questionNumber + 1,
        });
      }
    } catch (error) {
      setAnswerError(
        error instanceof ApiError ? error.message : "Something went wrong.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleNewInterview() {
    setTopic("");
    setStartError(null);
    setScreen({ kind: "landing" });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold tracking-tight">
          Mini AI Interviewer
        </span>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center gap-10 px-6 py-16">
        {screen.kind === "landing" && (
          <motion.div
            key="landing"
            {...fadeSlide}
            className="flex w-full max-w-xl flex-col items-center gap-6 text-center"
          >
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                What would you like to be interviewed about?
              </h1>
              <p className="text-muted-foreground">
                A short, adaptive conversation on any topic you choose. No right
                answers, no scoring - just a conversation that follows what you
                actually say.
              </p>
            </div>

            {backendStatus === "checking" && (
              <div className="w-full">
                <BackendWakeupBanner />
              </div>
            )}

            <div className="flex w-full flex-col gap-3">
              <Input
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleStart();
                }}
                placeholder="e.g. how you learned to cook"
                disabled={backendStatus !== "ready" || starting}
              />
              {startError && (
                <p className="text-destructive text-sm">{startError}</p>
              )}
              <Button
                onClick={handleStart}
                disabled={
                  backendStatus !== "ready" || starting || !topic.trim()
                }
              >
                {starting ? "Starting..." : "Start Interview"}
              </Button>
            </div>

            <TopicSuggestions onSelect={setTopic} />
          </motion.div>
        )}

        {screen.kind === "interview" && (
          <motion.div
            key={screen.question}
            {...fadeSlide}
            className="flex w-full justify-center"
          >
            <QuestionCard
              question={screen.question}
              questionNumber={screen.questionNumber}
              submitting={submitting}
              errorMessage={answerError}
              onSubmit={handleAnswer}
            />
          </motion.div>
        )}

        {screen.kind === "result" && (
          <motion.div
            key="result"
            {...fadeSlide}
            className="flex w-full justify-center"
          >
            <ResultCard
              topic={screen.topic}
              result={screen.result}
              onNewInterview={handleNewInterview}
            />
          </motion.div>
        )}

        {screen.kind !== "interview" && (
          <RecentInterviews refreshKey={refreshKey} />
        )}
      </main>
    </div>
  );
}
