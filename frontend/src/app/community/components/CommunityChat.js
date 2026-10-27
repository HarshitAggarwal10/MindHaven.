"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, HeartHandshake, MessageCircle, Send, ShieldCheck, Sparkles, ThumbsUp, UsersRound } from "lucide-react";
import { getChatMessages, getChatRoom } from "@/lib/community-api";

const CONVERSATION_STARTERS = [
  { label: "A small win", message: "One small thing I got through today was..." },
  { label: "What helps", message: "Something that helps me when things feel heavy is..." },
  { label: "Ask for support", message: "I could use a little support with..." },
  { label: "Just listening", message: "I'm here to listen and learn today." },
];

const REACTIONS = [
  { value: "care", label: "Care", Icon: Heart },
  { value: "support", label: "Support", Icon: HeartHandshake },
  { value: "thanks", label: "Thanks", Icon: ThumbsUp },
  { value: "hope", label: "Hope", Icon: Sparkles },
];

const REACTION_ICONS = Object.fromEntries(REACTIONS.map((reaction) => [reaction.value, reaction]));

function getWebSocketUrl(roomId, token) {
  const apiOrigin = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const url = new URL(apiOrigin);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `/ws/community/${roomId}/`;
  url.search = new URLSearchParams({ token }).toString();
  return url.toString();
}

export default function CommunityChat({ slug }) {
  const [room, setRoom] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const socketRef = useRef(null);
  const tailRef = useRef(null);
  const inputRef = useRef(null);

  const receiveEvent = useCallback((event) => {
    if (event.type === "presence.update") {
      setOnlineCount(event.online_count);
    } else if (event.type === "chat.message.created") {
      setMessages((current) => [...current, event.message]);
    } else if (event.type === "chat.reaction.updated") {
      setMessages((current) => current.map((message) => {
        if (message.id !== event.message_id) return message;
        const reactions = [...(message.reactions || [])];
        const index = reactions.findIndex((reaction) => reaction.emoji === event.emoji);
        if (index === -1 && !event.removed) reactions.push({ emoji: event.emoji, count: 1 });
        else if (index !== -1) {
          const count = reactions[index].count + (event.removed ? -1 : 1);
          if (count <= 0) reactions.splice(index, 1);
          else reactions[index] = { ...reactions[index], count };
        }
        return { ...message, reactions };
      }));
    } else if (event.type === "chat.message.edited") {
      setMessages((current) => current.map((message) => message.id === event.message.id ? { ...message, ...event.message } : message));
    } else if (event.type === "chat.message.deleted") {
      setMessages((current) => current.filter((message) => message.id !== event.message_id));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let socket;
    let reconnectTimer;
    let retryDelay = 1000;

    async function connect() {
      try {
        setError("");
        setHistoryLoading(true);
        setConnection("connecting");
        const roomData = await getChatRoom(slug);
        if (cancelled) return;
        setRoom(roomData);
        setOnlineCount(roomData.online_count || 0);
        const history = await getChatMessages(roomData.room_id);
        if (cancelled) return;
        setMessages([...history].reverse());
        setHistoryLoading(false);

        const token = localStorage.getItem("mh_token");
        if (!token) throw new Error("Please sign in again to join the live chat.");

        const openSocket = () => {
          if (cancelled) return;
          socket = new WebSocket(getWebSocketUrl(roomData.room_id, token));
          socketRef.current = socket;
          socket.onopen = () => {
            retryDelay = 1000;
            setError("");
            setConnection("connected");
          };
          socket.onmessage = (messageEvent) => {
            try {
              receiveEvent(JSON.parse(messageEvent.data));
            } catch {
              setError("A live chat update could not be read.");
            }
          };
          socket.onerror = () => setConnection("disconnected");
          socket.onclose = (closeEvent) => {
            setConnection("disconnected");
            if (!cancelled && closeEvent.code !== 1000) {
              setConnection("reconnecting");
              reconnectTimer = setTimeout(openSocket, retryDelay);
              retryDelay = Math.min(retryDelay * 2, 10000);
            }
          };
        };
        openSocket();
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || "The live chat could not be loaded.");
          setConnection("disconnected");
          setHistoryLoading(false);
        }
      }
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      socket?.close(1000, "Chat view closed");
      socketRef.current = null;
    };
  }, [receiveEvent, retryCount, slug]);

  useEffect(() => {
    tailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || socketRef.current?.readyState !== WebSocket.OPEN) return;
    socketRef.current.send(JSON.stringify({ type: "chat.message", body }));
    setDraft("");
  };

  const react = (messageId, emoji) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "chat.reaction", message_id: messageId, emoji }));
    }
  };

  const chooseStarter = (message) => {
    setDraft(message);
    inputRef.current?.focus();
  };

  return (
    <section className="mb-8 overflow-hidden rounded-[1.75rem] border border-teal-100 bg-[#fffdf9] font-[Quicksand] shadow-[0_24px_65px_-32px_rgba(15,118,110,0.5)]">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-[#126D68] via-teal-700 to-emerald-700 px-5 py-4 text-white sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white">
            <MessageCircle aria-hidden="true" size={21} />
          </span>
          <div className="min-w-0">
            <h2 className="truncate font-[Quicksand] text-lg font-bold sm:text-xl">{room?.community || "Community"} Lounge</h2>
            <p className="truncate text-xs text-teal-50 sm:text-sm">{room?.display_name ? `You appear as ${room.display_name}` : "A kind word can make a difference."}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold sm:text-sm" aria-label={`${onlineCount} members online`}>
            <UsersRound aria-hidden="true" size={14} />
            {onlineCount} online
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold sm:text-sm" role="status">
            <span aria-hidden="true" className={`inline-block h-2 w-2 rounded-full ${connection === "connected" ? "bg-emerald-300" : connection === "disconnected" ? "bg-rose-300" : "bg-amber-300"}`} />
            {connection === "connected" ? "Connected" : connection === "connecting" ? "Connecting" : connection === "reconnecting" ? "Reconnecting" : "Offline"}
          </span>
        </div>
      </header>

      {error && (
        <p className="flex flex-wrap items-center justify-between gap-2 bg-rose-50 px-5 py-3 text-sm text-rose-700" role="alert">
          <span>{error}</span>
          {connection === "disconnected" && (
            <button className="font-bold underline underline-offset-2" onClick={() => setRetryCount((count) => count + 1)} type="button">
              Try again
            </button>
          )}
        </p>
      )}

      <div aria-live="polite" className="h-[min(70vh,680px)] min-h-[440px] space-y-4 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#E1F3ED] via-[#F7FBF9] to-[#FFFDF8] p-4 sm:p-7 lg:p-9">
        {historyLoading ? (
          <div className="flex h-full flex-col items-center justify-center text-center" role="status">
            <span className="mb-3 size-9 animate-spin rounded-full border-[3px] border-teal-100 border-t-teal-600" aria-hidden="true" />
            <p className="font-semibold text-slate-700">Opening your community space...</p>
            <p className="mt-1 text-sm text-slate-500">Loading the conversation securely.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex min-h-full flex-col items-center justify-center py-4 text-center">
            <span className="mb-4 flex size-16 items-center justify-center rounded-[1.35rem] border border-white bg-white/85 text-teal-700 shadow-[0_12px_30px_-18px_rgba(15,118,110,0.55)]">
              <HeartHandshake aria-hidden="true" size={30} strokeWidth={1.6} />
            </span>
            <p className="text-lg font-extrabold text-slate-800 sm:text-xl">A gentle hello is enough to begin.</p>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">
              This room is ready when you are. Choose a prompt to start a message, or simply listen for a while.
            </p>
            <div className="mt-6 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
              {CONVERSATION_STARTERS.map(({ label, message }, index) => (
                <button
                  className="group flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-white/90 bg-white/85 px-4 py-3 text-left shadow-[0_8px_24px_-20px_rgba(15,118,110,0.6)] transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={connection !== "connected"}
                  key={label}
                  onClick={() => chooseStarter(message)}
                  type="button"
                >
                  <span>
                    <span className="block text-xs font-bold uppercase tracking-[0.12em] text-teal-800">{label}</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">{message}</span>
                  </span>
                  <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${["bg-teal-50 text-teal-700", "bg-amber-50 text-amber-700", "bg-rose-50 text-rose-700", "bg-violet-50 text-violet-700"][index]}`}>
                    <MessageCircle size={15} />
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <ShieldCheck aria-hidden="true" className="text-teal-700" size={14} />
              Kindness matters. Share only what feels comfortable.
            </p>
          </div>
        ) : messages.map((message) => (
          <article className="max-w-[96%] rounded-2xl rounded-tl-md border border-teal-100/80 bg-white p-4 shadow-[0_10px_28px_-22px_rgba(15,118,110,0.65)] transition-shadow duration-300 hover:shadow-md sm:max-w-[78%] lg:max-w-[68%]" key={message.id}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 text-xs font-bold text-teal-800">
                  {message.author_handle?.trim().charAt(0).toUpperCase() || "M"}
                </span>
                <span className="truncate font-semibold text-teal-800">{message.author_handle}</span>
              </span>
              <time className="shrink-0 text-xs text-slate-400" dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {message.reactions?.map((reaction) => (
                <button aria-label={`Toggle ${REACTION_ICONS[reaction.emoji]?.label || "reaction"} reaction (${reaction.count})`} className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800 transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={connection !== "connected"} key={reaction.emoji} onClick={() => react(message.id, reaction.emoji)} title={`Toggle ${REACTION_ICONS[reaction.emoji]?.label || "reaction"}`} type="button">
                  {(() => {
                    const ReactionIcon = REACTION_ICONS[reaction.emoji]?.Icon || Heart;
                    return <ReactionIcon aria-hidden="true" size={14} />;
                  })()}
                  {reaction.count}
                </button>
              ))}
              {REACTIONS.map(({ value, label, Icon }) => (
                <button aria-label={`React with ${label}`} className="rounded-full p-2 text-slate-400 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-40" disabled={connection !== "connected"} key={value} onClick={() => react(message.id, value)} title={label} type="button">
                  <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </article>
        ))}
        <div ref={tailRef} />
      </div>

      <form className="flex gap-3 border-t border-teal-100 bg-white p-4 sm:gap-4 sm:p-5 lg:px-7" onSubmit={sendMessage}>
        <input
          aria-label="Write a chat message"
          className="min-w-0 flex-1 rounded-full border border-teal-100 bg-[#F7FBF9] px-5 py-3.5 text-sm text-slate-800 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 placeholder:text-slate-400 sm:px-6"
          maxLength={4000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write something kind..."
          ref={inputRef}
          value={draft}
        />
        <button aria-label="Send message" className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-50 sm:size-14" disabled={!draft.trim() || connection !== "connected"} type="submit">
          <Send aria-hidden="true" size={18} />
        </button>
      </form>
      <p className="flex items-center justify-center gap-1.5 bg-white px-5 pb-4 text-center text-xs text-slate-400">
        <ShieldCheck aria-hidden="true" size={13} />
        Please avoid sharing private contact details. Be gentle with yourself and one another.
      </p>
    </section>
  );
}
