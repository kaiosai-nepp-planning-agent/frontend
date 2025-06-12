"use client"; // App Routerのクライアントコンポーネントであることを宣言

import React, { useState, FormEvent, useEffect, useRef } from "react";

// APIのベースURLを、Next.jsのプロキシAPIのパスに変更
// App Routerでは、URLのベースはアプリケーションのルートになるので、相対パスでOK
const API_BASE_URL = ""; // または '/' でも動作します
const USER_ID = "u_123";
const SESSION_ID = "s_123";

interface MessagePart {
  text: string;
}

interface Message {
  role: "user" | "model";
  parts: MessagePart[];
}

interface ApiResponseEvent {
  content?: {
    parts: MessagePart[];
  };
  author?: string;
  error?: string; // プロキシからのエラーメッセージも考慮
}

export default function HomePage() {
  // コンポーネント名をHomePageなどに変更
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * 初回ロード時にセッションを初期化する非同期関数
   * プロキシAPIの /api/proxy エンドポイントを叩き、セッション作成を要求します。
   */
  // useEffect(() => {
  // const initializeSession = async () => {
  // // プロキシAPIのURL
  // const url = `${API_BASE_URL}/api/proxy`;
  // console.log("Initializing session via proxy URL:", url);

  // try {
  //   const response = await fetch(url, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     // リクエストボディに 'type: initializeSession' を追加し、ユーザーIDとセッションIDを渡す
  //     body: JSON.stringify({
  //       type: "initializeSession",
  //       userId: USER_ID,
  //       sessionId: SESSION_ID,
  //     }),
  //   });

  //   if (!response.ok) {
  //     const errorData = await response
  //       .json()
  //       .catch(() => ({
  //         error: "Unknown error during session initialization.",
  //       }));
  //     throw new Error(
  //       errorData.error || `API error: ${response.statusText}`
  //     );
  //   }

  //   console.log("Session initialized or already exists.");
  //   // 必要であれば、APIからの初期メッセージなどを処理することも可能
  //     } catch (error: any) {
  //       console.error("Error initializing session:", error.message);
  //       setMessages((prevMessages) => [
  //         ...prevMessages,
  //         {
  //           role: "model",
  //           parts: [
  //             { text: `セッションの初期化に失敗しました: ${error.message}` },
  //           ],
  //         },
  //       ]);
  //     }
  //   };
  //   initializeSession();
  // }, []); // 空の依存配列でコンポーネントマウント時に一度だけ実行

  /**
   * メッセージリストの最下部にスクロールする処理
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // メッセージが更新されるたびに実行

  /**
   * フォーム送信時の処理
   * ユーザーメッセージをプロキシAPIの /api/proxy エンドポイント経由で送信します。
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); // デフォルトのフォーム送信を防ぐ
    if (!input.trim() || isLoading) return; // 入力が空か、ロード中なら何もしない

    const userMessage: Message = { role: "user", parts: [{ text: input }] };
    setMessages((prevMessages) => [...prevMessages, userMessage]); // ユーザーメッセージをUIに追加
    setInput(""); // 入力フィールドをクリア
    setIsLoading(true); // ロード状態を開始

    // プロキシAPIのURL
    const url = `${API_BASE_URL}/api/proxy`;
    console.log("Sending message via proxy URL:", url);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // リクエストボディに 'type: sendMessage' を追加し、外部APIに転送するデータを渡す
        body: JSON.stringify({
          type: "sendMessage", // プロキシAPIが処理を識別するためのタイプ
          app_name: "planning_agent",
          user_id: USER_ID,
          session_id: SESSION_ID,
          new_message: userMessage,
        }),
      });

      if (!response.ok) {
        // APIからのエラーレスポンスを解析し、エラーメッセージを生成
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error during message sending." }));
        throw new Error(errorData.error || `API error: ${response.statusText}`);
      }

      const data: ApiResponseEvent[] = await response.json();
      // AIからの応答メッセージのみをフィルタリングしてUIに追加
      const modelResponses: Message[] = data
        .filter(
          (event) =>
            event.author === "kaosai_planning_agent" && event.content?.parts
        )
        .map((event) => ({
          role: "model",
          parts: event.content!.parts,
        }));

      setMessages((prevMessages) => [...prevMessages, ...modelResponses]);
    } catch (error: any) {
      console.error("Error sending message:", error.message);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "model",
          parts: [
            {
              text: `メッセージの送信中にエラーが発生しました: ${error.message}`,
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false); // ロード状態を終了
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        maxWidth: "800px",
        margin: "0 auto",
        border: "1px solid #ccc",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      {/* ヘッダー部分 */}
      <h1
        style={{
          textAlign: "center",
          padding: "15px",
          background: "#4CAF50",
          color: "white",
          margin: 0,
          fontSize: "1.5rem",
          borderBottom: "1px solid #ddd",
        }}
      >
        海王祭プランニングAI
      </h1>

      {/* チャットメッセージ表示エリア */}
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: "20px",
          background: "#F8F8F8",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              textAlign: msg.role === "user" ? "right" : "left",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "10px 15px",
                borderRadius: "20px",
                backgroundColor: msg.role === "user" ? "#E0F2F7" : "#FFFFFF",
                color: "#333",
                wordBreak: "break-word",
                maxWidth: "80%",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              {msg.parts.map((part, pIdx) => (
                <React.Fragment key={pIdx}>{part.text}</React.Fragment>
              ))}
            </span>
          </div>
        ))}
        {/* AIの入力中インジケーター */}
        {isLoading && (
          <div style={{ textAlign: "left", marginBottom: "15px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "10px 15px",
                borderRadius: "20px",
                backgroundColor: "#FFFFFF",
                color: "#333",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              }}
            >
              AIが入力中...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} /> {/* スクロール位置調整用の参照 */}
      </div>

      {/* メッセージ入力フォーム */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          padding: "15px",
          borderTop: "1px solid #ddd",
          background: "#F0F0F0",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力してください..."
          style={{
            flexGrow: 1,
            padding: "10px",
            border: "1px solid #CCC",
            borderRadius: "25px",
            marginRight: "10px",
            fontSize: "1rem",
          }}
          disabled={isLoading} // ロード中は入力不可
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            background: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "25px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "bold",
            transition: "background-color 0.3s ease",
          }}
          disabled={isLoading} // ロード中は送信不可
        >
          送信
        </button>
      </form>
    </div>
  );
}
