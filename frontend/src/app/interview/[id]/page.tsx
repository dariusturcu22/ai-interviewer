import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Link from "next/link";

import { ResultCard } from "@/components/result-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiError, getInterview, type InterviewDetail } from "@/lib/api";

async function loadInterview(id: string): Promise<InterviewDetail | "error"> {
  try {
    return await getInterview(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return "error";
  }
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interview = await loadInterview(id);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center px-6 py-16">
        {interview === "error" ? (
          <p className="text-muted-foreground">
            Couldn&apos;t load this interview right now. Please try again
            shortly.
          </p>
        ) : interview.status === "completed" &&
          interview.summary &&
          interview.sentiment &&
          interview.sentiment_note ? (
          <ResultCard
            topic={interview.topic}
            result={{
              summary: interview.summary,
              sentiment: interview.sentiment,
              sentiment_note: interview.sentiment_note,
              key_points: interview.key_points ?? [],
              keywords: interview.keywords ?? [],
              closing_message: "",
            }}
          />
        ) : (
          <div className="max-w-xl text-center">
            <p className="text-lg font-medium">{interview.topic}</p>
            <p className="text-muted-foreground mt-2">
              This interview didn&apos;t finish, so there&apos;s no result to
              show yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
