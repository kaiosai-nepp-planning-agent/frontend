import { NextResponse } from "next/server";

const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL;

// 外部APIのレスポンスに合わせた型定義 (必要に応じて調整)
interface ExternalSessionResponse {
  id: string;
  appName: string;
  userId: string;
  state: Record<string, unknown>;
  events: unknown[];
  lastUpdateTime: number;
  detail?: string;
}

interface ExternalRunResponseEvent {
  content?: {
    parts: { text: string }[];
  };
  usageMetadata?: unknown;
  invocationId?: string;
  author: string;
  actions?: unknown;
  id?: string;
  timestamp?: number;
}

// POSTリクエストを処理する関数
export async function POST(req: Request) {
  if (!EXTERNAL_API_BASE_URL) {
    console.error("EXTERNAL_API_BASE_URL is not defined in .env.local");
    return NextResponse.json(
      { error: "Server configuration error: API base URL is missing." },
      { status: 500 }
    );
  }

  const requestBody = await req.json();
  const requestType = requestBody.type; // リクエストのタイプを識別するフィールド

  try {
    if (requestType === "initializeSession") {
      const { userId, sessionId } = requestBody;
      if (!userId || !sessionId) {
        return NextResponse.json(
          { error: "Missing userId or sessionId for session initialization." },
          { status: 400 }
        );
      }
      const externalApiUrl = `${EXTERNAL_API_BASE_URL}/apps/planning_agent/users/${userId}/sessions/${sessionId}`;

      const externalApiResponse = await fetch(externalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!externalApiResponse.ok) {
        const errorData = await externalApiResponse.json().catch(() => ({}));
        console.error(
          "External API session init failed:",
          externalApiResponse.status,
          errorData
        );
        return NextResponse.json(errorData, {
          status: externalApiResponse.status,
        });
      }

      const data: ExternalSessionResponse = await externalApiResponse.json();
      return NextResponse.json(data, { status: 200 });
    } else if (requestType === "sendMessage") {
      const { app_name, user_id, session_id, new_message } = requestBody;
      if (!app_name || !user_id || !session_id || !new_message) {
        return NextResponse.json(
          { error: "Missing required fields for sending message." },
          { status: 400 }
        );
      }
      const externalApiUrl = `${EXTERNAL_API_BASE_URL}/run`;

      const externalApiResponse = await fetch(externalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ app_name, user_id, session_id, new_message }),
      });

      if (!externalApiResponse.ok) {
        const errorData = await externalApiResponse.json().catch(() => ({}));
        console.error(
          "External API run failed:",
          externalApiResponse.status,
          errorData
        );
        return NextResponse.json(errorData, {
          status: externalApiResponse.status,
        });
      }

      const data: ExternalRunResponseEvent[] = await externalApiResponse.json();
      return NextResponse.json(data, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Invalid request type provided." },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error in proxy route handler:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred in the proxy." },
      { status: 500 }
    );
  }
}
