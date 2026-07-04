"use client";

import { useEffect, useRef, useState } from "react";
import { useUI } from "@/store/ui";
import { CHAT_GREETING, QUICK_REPLIES, getBotReply } from "./chat-data";

interface Message {
  id: number;
  type: "bot" | "user";
  html: string;
}

export function Chatbot() {
  const chatOpen = useUI((s) => s.chatOpen);
  const toggleChat = useUI((s) => s.toggleChat);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const idRef = useRef(0);
  const messagesRef = useRef<HTMLDivElement>(null);

  const nextId = () => ++idRef.current;

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, typing]);

  useEffect(() => {
    if (chatOpen && !started) {
      setStarted(true);
      botReply(CHAT_GREETING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatOpen]);

  const botReply = (html: string) => {
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setMessages((prev) => [...prev, { id: nextId(), type: "bot", html }]);
      },
      600 + Math.random() * 500,
    );
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: nextId(), type: "user", html: trimmed }]);
    botReply(getBotReply(trimmed));
  };

  return (
    <div className="fixed bottom-20 right-4 z-[60] flex flex-col items-end sm:bottom-24">
      {chatOpen && (
        <div className="mb-3 flex h-[26rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary-dark px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-lg">
                🎆
              </span>
              <div className="leading-tight">
                <h4 className="text-sm font-bold">SRK Crackers Bot</h4>
                <span className="text-[0.7rem] text-white/80">● Online — Demo Assistant</span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleChat}
              aria-label="Close chat"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"
            >
              ✕
            </button>
          </div>

          <div ref={messagesRef} className="scrollbar-thin flex-1 space-y-2 overflow-y-auto bg-brandbg p-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.type === "user"
                    ? "ml-auto bg-primary text-white"
                    : "mr-auto bg-white text-ink shadow-sm [&_a]:font-semibold [&_a]:text-primary [&_a]:underline"
                }`}
                dangerouslySetInnerHTML={{ __html: message.html }}
              />
            ))}
            {typing && (
              <div className="mr-auto rounded-2xl bg-white px-3 py-2 text-xs text-ink-muted shadow-sm">
                SRK Bot is typing...
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-line bg-white px-3 py-2">
            {QUICK_REPLIES.map((quick) => (
              <button
                key={quick.value}
                type="button"
                onClick={() => send(quick.value)}
                className="rounded-full border border-line px-2.5 py-1 text-[0.7rem] text-ink transition hover:border-primary hover:text-primary"
              >
                {quick.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-line bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  send(input);
                  setInput("");
                }
              }}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-line px-3 py-2 text-sm outline-none focus:border-primary"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => {
                send(input);
                setInput("");
              }}
              aria-label="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={toggleChat}
        aria-label="Open chat"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl text-white shadow-lg transition hover:bg-primary-dark"
      >
        💬
      </button>
    </div>
  );
}
