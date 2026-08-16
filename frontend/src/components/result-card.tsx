import { Sparkles } from "lucide-react";

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
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="text-primary size-4" />
          {topic}
        </CardTitle>
        <CardDescription>{result.summary}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Badge
          className={sentimentBadgeClass[result.sentiment]}
          variant="outline"
        >
          {sentimentLabel[result.sentiment]}
        </Badge>
        <p className="text-muted-foreground text-sm">{result.sentiment_note}</p>

        {result.key_points.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium">Key points</h3>
            <ul className="text-foreground/90 list-disc space-y-1 pl-5 text-sm">
              {result.key_points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {result.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {result.keywords.map((keyword) => (
              <Badge key={keyword} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      {onNewInterview && (
        <CardFooter>
          <Button onClick={onNewInterview} className="w-full">
            New interview
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
