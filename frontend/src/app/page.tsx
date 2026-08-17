"use client";

import { MessageCircleHeart } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { BackendWakeupBanner } from "@/components/backend-wakeup-banner";
import { LoadingMessages } from "@/components/loading-messages";
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
  getInterview,
  startInterview,
  submitAnswer,
  type InterviewDetail,
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

type ResumableSession = { id: string; topic: string };

const ACTIVE_INTERVIEW_KEY = "mini-interviewer:active-interview";
const MAX_TOPIC_LENGTH = 200;

const START_LOADING_MESSAGES = [
  "Reading your topic...",
  "Planning a few focus areas...",
  "Drafting your first question...",
];

const fadeSlide = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2 },
};

function saveActiveInterview(id: string, topic: string) {
  localStorage.setItem(ACTIVE_INTERVIEW_KEY, JSON.stringify({ id, topic }));
}

function loadActiveInterview(): ResumableSession | null {
  try {
    const raw = localStorage.getItem(ACTIVE_INTERVIEW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearActiveInterview() {
  localStorage.removeItem(ACTIVE_INTERVIEW_KEY);
}

// The pending (unanswered) question is always the last transcript entry while an
// interview is in progress - see backend/app/routes.py for how transcript entries
// get appended with answer=null and then filled in.
function screenFromDetail(detail: InterviewDetail): Screen | null {
  if (
    detail.status === "completed" &&
    detail.summary &&
    detail.sentiment &&
    detail.sentiment_note
  ) {
    return {
      kind: "result",
      topic: detail.topic,
      result: {
        summary: detail.summary,
        sentiment: detail.sentiment,
        sentiment_note: detail.sentiment_note,
        key_points: detail.key_points ?? [],
        keywords: detail.keywords ?? [],
        closing_message: "",
      },
    };
  }

  const pending = detail.transcript.findLast((turn) => turn.answer === null);
  if (!pending) return null;

  return {
    kind: "interview",
    sessionId: detail.id,
    topic: detail.topic,
    question: pending.question,
    questionNumber: detail.transcript.length,
  };
}

export default function Home() {
  const backendStatus = useBackendHealth();

  const [screen, setScreen] = useState<Screen>({ kind: "landing" });
  const [topic, setTopic] = useState("");
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [resumable, setResumable] = useState<ResumableSession | null>(null);
  const [resuming, setResuming] = useState(false);

  async function handleResume(id: string) {
    setResuming(true);
    try {
      const detail = await getInterview(id);
      const nextScreen = screenFromDetail(detail);
      if (nextScreen?.kind === "interview") {
        saveActiveInterview(id, detail.topic);
        setResumable({ id, topic: detail.topic });
        setScreen(nextScreen);
      } else {
        clearActiveInterview();
        setResumable(null);
        if (nextScreen) {
          setScreen(nextScreen);
          setRefreshKey((key) => key + 1);
        }
      }
    } catch {
      clearActiveInterview();
      setResumable(null);
    } finally {
      setResuming(false);
    }
  }

  useEffect(() => {
    const resumeId = new URLSearchParams(window.location.search).get("resume");
    if (resumeId) {
      window.history.replaceState({}, "", "/");
      setTimeout(() => handleResume(resumeId), 0);
      return;
    }
    setTimeout(() => setResumable(loadActiveInterview()), 0);
  }, []);

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
      const sessionId = response.session_id!;
      const trimmedTopic = topic.trim();
      saveActiveInterview(sessionId, trimmedTopic);
      setResumable({ id: sessionId, topic: trimmedTopic });
      setScreen({
        kind: "interview",
        sessionId,
        topic: trimmedTopic,
        question: response.question!,
        questionNumber: response.question_number ?? 1,
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
      const response = await submitAnswer(
        screen.sessionId,
        answer,
        screen.questionNumber,
      );
      if (response.status === "completed" && response.result) {
        clearActiveInterview();
        setResumable(null);
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
          questionNumber: response.question_number ?? screen.questionNumber + 1,
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
    clearActiveInterview();
    setResumable(null);
    setScreen({ kind: "landing" });
  }

  function goHome() {
    setScreen({ kind: "landing" });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-5">
        <button
          onClick={goHome}
          className="hover:text-primary flex items-center gap-2 text-lg font-semibold tracking-tight transition-colors"
        >
          <MessageCircleHeart className="text-primary size-5" />
          Mini AI Interviewer
        </button>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center gap-12 px-6 py-20 sm:py-24">
        {screen.kind === "landing" && (
          <motion.div
            key="landing"
            {...fadeSlide}
            className="flex w-full max-w-2xl flex-col items-center gap-8 text-center"
          >
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                What would you like to be interviewed about?
              </h1>
              <p className="text-muted-foreground text-lg text-balance">
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

            {resumable && (
              <div className="bg-muted/50 w-full rounded-lg border p-4 text-left">
                <p className="text-sm">
                  You have an interview in progress about{" "}
                  <span className="font-medium">{resumable.topic}</span>.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleResume(resumable.id)}
                    disabled={resuming}
                  >
                    {resuming ? "Loading..." : "Continue"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      clearActiveInterview();
                      setResumable(null);
                    }}
                  >
                    Discard
                  </Button>
                </div>
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
                maxLength={MAX_TOPIC_LENGTH}
                disabled={backendStatus !== "ready" || starting}
                className="h-12 px-4 text-base"
              />
              {startError && (
                <p className="text-destructive text-sm">{startError}</p>
              )}
              <Button
                onClick={handleStart}
                disabled={
                  backendStatus !== "ready" || starting || !topic.trim()
                }
                className="h-12 text-base"
              >
                {starting ? "Starting..." : "Start Interview"}
              </Button>
              {starting && (
                <LoadingMessages messages={START_LOADING_MESSAGES} />
              )}
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
