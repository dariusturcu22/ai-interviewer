// Server-side rendering (e.g. the read-only past-interview page) runs inside the Next.js
// server process, which in the Docker Compose setup is a different container than the
// browser. "localhost" there refers to the frontend container itself, not the backend.
// BACKEND_INTERNAL_URL lets server-side fetches use the Docker network name instead;
// it's unset outside Docker, where NEXT_PUBLIC_API_URL is already reachable from both sides.
const API_BASE_URL =
  (typeof window === "undefined" && process.env.BACKEND_INTERNAL_URL) ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000";

export type InterviewStatus = "in_progress" | "completed" | "declined";
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export interface StartInterviewResponse {
  status: "in_progress" | "declined";
  session_id: string | null;
  question: string | null;
  question_number: number | null;
  message: string | null;
}

export interface TranscriptTurn {
  question: string;
  focus_area: string;
  is_redirect: boolean;
  answer: string | null;
}

export interface InterviewResult {
  summary: string;
  sentiment: Sentiment;
  sentiment_note: string;
  key_points: string[];
  keywords: string[];
  closing_message: string;
  transcript: TranscriptTurn[];
}

export interface AnswerResponse {
  status: "in_progress" | "completed";
  question: string | null;
  question_number: number | null;
  result: InterviewResult | null;
}

export interface InterviewListItem {
  id: string;
  topic: string;
  status: InterviewStatus;
  created_at: string;
}

export interface InterviewDetail {
  id: string;
  topic: string;
  status: InterviewStatus;
  plan: { strategy: string; focus_areas: string[] };
  transcript: TranscriptTurn[];
  summary: string | null;
  sentiment: Sentiment | null;
  sentiment_note: string | null;
  key_points: string[] | null;
  keywords: string[] | null;
  created_at: string;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// FastAPI returns two different `detail` shapes depending on the failure: a plain string
// for HTTPException (404, 409, ...), or an array of Pydantic validation-error objects (each
// with a `msg` field) for a 422. Reading only the string case meant a validation failure,
// e.g. a topic over the backend's 200-char limit, showed a generic "request failed" message
// instead of anything actionable.
function extractErrorMessage(
  body: unknown,
  path: string,
  status: number,
): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const messages = detail
      .map((error) =>
        error && typeof error === "object"
          ? (error as { msg?: unknown }).msg
          : null,
      )
      .filter((msg): msg is string => typeof msg === "string");
    if (messages.length > 0) return messages.join(" ");
  }
  return `Request to ${path} failed with status ${status}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(
      extractErrorMessage(body, path, response.status),
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function checkHealth(): Promise<{ status: string }> {
  return request("/health");
}

export function startInterview(topic: string): Promise<StartInterviewResponse> {
  return request("/interview/start", {
    method: "POST",
    body: JSON.stringify({ topic }),
  });
}

export function submitAnswer(
  sessionId: string,
  answer: string,
  questionNumber: number,
): Promise<AnswerResponse> {
  return request("/interview/answer", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      answer,
      question_number: questionNumber,
    }),
  });
}

export function listInterviews(): Promise<InterviewListItem[]> {
  return request("/interviews");
}

export function getInterview(id: string): Promise<InterviewDetail> {
  return request(`/interview/${id}`);
}
