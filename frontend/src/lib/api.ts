const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type InterviewStatus = "in_progress" | "completed" | "declined";
export type Sentiment = "positive" | "neutral" | "negative" | "mixed";

export interface StartInterviewResponse {
  status: "in_progress" | "declined";
  session_id: string | null;
  question: string | null;
  message: string | null;
}

export interface InterviewResult {
  summary: string;
  sentiment: Sentiment;
  sentiment_note: string;
  key_points: string[];
  keywords: string[];
  closing_message: string;
}

export interface AnswerResponse {
  status: "in_progress" | "completed";
  question: string | null;
  result: InterviewResult | null;
}

export interface InterviewListItem {
  id: string;
  topic: string;
  status: InterviewStatus;
  created_at: string;
}

export interface TranscriptTurn {
  question: string;
  focus_area: string;
  is_redirect: boolean;
  answer: string | null;
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      body?.detail && typeof body.detail === "string"
        ? body.detail
        : `Request to ${path} failed with status ${response.status}`;
    throw new ApiError(message, response.status);
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

export function submitAnswer(sessionId: string, answer: string): Promise<AnswerResponse> {
  return request("/interview/answer", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, answer }),
  });
}

export function listInterviews(): Promise<InterviewListItem[]> {
  return request("/interviews");
}

export function getInterview(id: string): Promise<InterviewDetail> {
  return request(`/interview/${id}`);
}
