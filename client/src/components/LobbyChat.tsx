import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Message } from "../types/api";
import { formatRelativeTime } from "../utils/formatters";
import { getInitials } from "../utils/presentation";

export interface ChatSystemMessage {
  id: string;
  content: string;
  createdAt: string;
  tone?: "info" | "success" | "error";
}

interface LobbyChatProps {
  messages: Message[];
  systemMessages: ChatSystemMessage[];
  currentUserId?: string;
  canSend: boolean;
  isSending: boolean;
  sendError: string | null;
  statusLabel: string;
  onSendMessage: (content: string) => Promise<boolean>;
}

type ChatTimelineItem =
  | {
      id: string;
      type: "message";
      createdAt: string;
      message: Message;
    }
  | {
      id: string;
      type: "system";
      createdAt: string;
      systemMessage: ChatSystemMessage;
    };

const systemToneClasses = {
  info: "border-[#9ee8e8]/18 bg-[#176a6b]/12 text-[#d9fffe]",
  success: "border-[#9ee8e8]/18 bg-[#0f3b3b]/22 text-[#d9fffe]",
  error: "border-[#ffb59f]/20 bg-[#802a0d]/16 text-[#fff6ee]",
};

function getReadableTimestamp(isoDate: string) {
  return new Date(isoDate).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function LobbyChat({
  messages,
  systemMessages,
  currentUserId,
  canSend,
  isSending,
  sendError,
  statusLabel,
  onSendMessage,
}: LobbyChatProps) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const timelineItems = useMemo<ChatTimelineItem[]>(() => {
    return [
      ...messages.map((message) => ({
        id: message.id,
        type: "message" as const,
        createdAt: message.createdAt,
        message,
      })),
      ...systemMessages.map((systemMessage) => ({
        id: systemMessage.id,
        type: "system" as const,
        createdAt: systemMessage.createdAt,
        systemMessage,
      })),
    ].sort((left, right) => {
      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return leftTime - rightTime;
    });
  }, [messages, systemMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [timelineItems.length]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || !canSend || isSending) {
      return;
    }

    const wasSent = await onSendMessage(content);
    if (wasSent) {
      setDraft("");
    }
  }

  return (
    <section className="glass-panel flex min-h-[560px] flex-col p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Squad comms</p>
          <h2 className="font-display mt-3 text-3xl text-white">Lobby chat</h2>
        </div>
        <span
          className={`status-chip ${
            canSend
              ? "border-[#9ee8e8]/18 bg-[#0f3b3b]/22 text-[#d9fffe]"
              : "border-white/14 bg-white/5 text-white/58"
          }`}
        >
          {statusLabel}
        </span>
      </div>

      <div
        aria-live="polite"
        className="mt-5 flex min-h-[300px] flex-1 flex-col gap-3 overflow-y-auto pr-1"
      >
        {timelineItems.length === 0 ? (
          <div className="glass-panel-soft flex min-h-[220px] items-center justify-center p-5 text-center">
            <p className="text-sm leading-6 text-white/62">
              No squad chatter yet.
            </p>
          </div>
        ) : (
          timelineItems.map((item) =>
            item.type === "system" ? (
              <div className="flex justify-center" key={item.id}>
                <div
                  className={`max-w-[90%] rounded-full border px-4 py-2 text-center text-xs leading-5 ${
                    systemToneClasses[item.systemMessage.tone ?? "info"]
                  }`}
                  title={getReadableTimestamp(item.createdAt)}
                >
                  <span className="font-caps uppercase tracking-[0.2em]">
                    System
                  </span>
                  <span className="mx-2 text-white/35">/</span>
                  <span>{item.systemMessage.content}</span>
                  <span className="ml-2 text-white/42">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>
            ) : (
              <article
                className={`feed-card glass-panel-soft px-4 py-4 ${
                  item.message.userId === currentUserId
                    ? "border-[#9ee8e8]/20 bg-[#0f3b3b]/14"
                    : ""
                }`}
                key={item.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#2b2a28] font-caps text-[10px] uppercase tracking-[0.18em] text-white">
                      {getInitials(item.message.user.username)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {item.message.user.username}
                        {item.message.userId === currentUserId ? " (You)" : ""}
                      </p>
                      <p
                        className="font-caps text-[10px] uppercase tracking-[0.2em] text-white/38"
                        title={getReadableTimestamp(item.createdAt)}
                      >
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-white/72">
                  {item.message.content}
                </p>
              </article>
            )
          )
        )}
        <div ref={endRef} />
      </div>

      {sendError ? (
        <div className="mt-4 rounded-[18px] border border-[#ffb59f]/20 bg-[#802a0d]/16 px-4 py-3 text-sm leading-6 text-[#fff6ee]">
          {sendError}
        </div>
      ) : null}

      <form className="mt-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Message</span>
          <textarea
            className="input-shell min-h-24 resize-none"
            disabled={!canSend || isSending}
            maxLength={500}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={canSend ? "Send a message" : "Chat is read-only"}
            value={draft}
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="font-caps text-[10px] uppercase tracking-[0.22em] text-white/38">
            {draft.trim().length}/500
          </span>
          <button
            className="button-primary min-w-36"
            disabled={!canSend || !draft.trim() || isSending}
            type="submit"
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </section>
  );
}
