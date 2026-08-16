"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { listInterviews, type InterviewListItem } from "@/lib/api";

export function RecentInterviews({ refreshKey }: { refreshKey: number }) {
  const [interviews, setInterviews] = useState<InterviewListItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listInterviews()
      .then((data) => {
        if (!cancelled) setInterviews(data);
      })
      .catch(() => {
        if (!cancelled) setInterviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!interviews || interviews.length === 0) return null;

  return (
    <div className="w-full max-w-xl">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <History className="size-4" />
        Recent interviews
      </h2>
      <ul className="flex flex-col divide-y rounded-lg border">
        {interviews.map((interview) => (
          <li key={interview.id}>
            <Link
              href={`/interview/${interview.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
            >
              <span className="truncate">{interview.topic}</span>
              <span className="shrink-0 text-muted-foreground">
                {new Date(interview.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
