import { ChevronDown, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { InterviewResult } from "@/lib/api";
import { sentimentBadgeClass, sentimentLabel } from "@/lib/sentiment";

interface ResultCardProps {
  topic: string;
  result: InterviewResult;
  onNewInterview?: () => void;
}

export function ResultCard({ topic, result, onNewInterview }: ResultCardProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="gap-3">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Sparkles className="text-primary size-5" />
          {topic}
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {result.summary}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <Badge
          className={`${sentimentBadgeClass[result.sentiment]} h-6 px-3 text-sm`}
          variant="outline"
        >
          {sentimentLabel[result.sentiment]}
        </Badge>
        <p className="text-muted-foreground text-base">
          {result.sentiment_note}
        </p>

        {result.key_points.length > 0 && (
          <div>
            <h3 className="mb-2 text-base font-medium">Key points</h3>
            <ul className="text-foreground/90 list-disc space-y-2 pl-5 text-base">
              {result.key_points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {result.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((keyword) => (
              // A trailing space after each badge (not just the flex gap) so copying the
              // page text or reading it with a screen reader doesn't run keywords together -
              // CSS gap creates visual spacing only, no actual space character.
              <span key={keyword}>
                <Badge variant="secondary" className="text-sm">
                  {keyword}
                </Badge>{" "}
              </span>
            ))}
          </div>
        )}

        {result.transcript.length > 0 && (
          <details className="group">
            <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium transition-colors">
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              Full transcript
            </summary>
            <ol className="mt-4 flex flex-col gap-4">
              {result.transcript.map((turn, index) => (
                <li key={index} className="flex flex-col gap-1">
                  <p className="text-foreground/90 text-sm font-medium">
                    {turn.question}
                  </p>
                  <p className="text-muted-foreground text-sm">{turn.answer}</p>
                </li>
              ))}
            </ol>
          </details>
        )}
      </CardContent>
      {onNewInterview && (
        <CardFooter>
          <Button onClick={onNewInterview} className="h-11 w-full text-base">
            New interview
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
