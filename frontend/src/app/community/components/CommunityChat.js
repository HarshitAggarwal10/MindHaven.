"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Heart, HeartHandshake, MessageCircle, Send, Sparkles, ThumbsUp } from "lucide-react";
import { getChatMessages, getChatRoom } from "@/lib/community-api";

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
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [connection, setConnection] = useState("connecting");
  const [error, setError] = useState("");
  const socketRef = useRef(null);
  const tailRef = useRef(null);

  const receiveEvent = useCallback((event) => {
    if (event.type === "chat.message.created") {
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
        const roomData = await getChatRoom(slug);
        if (cancelled) return;
        setRoom(roomData);
        const history = await getChatMessages(roomData.room_id);
        if (cancelled) return;
        setMessages([...history].reverse());

        const token = localStorage.getItem("mh_token");
        if (!token) throw new Error("Please sign in again to join the live chat.");

        const openSocket = () => {
          if (cancelled) return;
          socket = new WebSocket(getWebSocketUrl(roomData.room_id, token));
          socketRef.current = socket;
          socket.onopen = () => {
            retryDelay = 1000;
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
  }, [receiveEvent, slug]);

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

  return (
    <section className="mb-8 overflow-hidden rounded-[1.75rem] border border-teal-100 bg-[#fffdf9] font-[Quicksand] shadow-[0_18px_48px_-28px_rgba(15,118,110,0.45)]">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-teal-700 to-emerald-700 px-5 py-4 text-white sm:px-6">
        <div>
          <h2 className="flex items-center gap-2 font-[Quicksand] text-xl font-bold"><MessageCircle aria-hidden="true" size={20} /> Community live chat</h2>
          <p className="text-sm text-teal-50">{room?.display_name ? `You appear as ${room.display_name}` : "A kind word can make a difference."}</p>
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${connection === "connected" ? "bg-emerald-300" : "bg-amber-300"}`} />
          {connection === "connected" ? "Live" : connection === "connecting" ? "Connecting" : "Reconnecting"}
        </span>
      </header>

      {error && <p className="bg-rose-50 px-5 py-3 text-sm text-rose-700" role="alert">{error}</p>}

      <div aria-live="polite" className="h-[360px] space-y-4 overflow-y-auto bg-gradient-to-b from-[#EDF8F5] via-white to-[#FFFCF7] p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C1E8E3] to-[#E0F7F4] text-teal-700"><HeartHandshake aria-hidden="true" size={28} strokeWidth={1.6} /></span>
            <p className="font-[Quicksand] font-bold text-slate-700">The conversation starts with you</p>
            <p className="mt-1 text-sm text-slate-500">Share a thought, offer support, or simply say hello.</p>
          </div>
        ) : messages.map((message) => (
          <article className="max-w-[92%] rounded-2xl border border-teal-100/80 bg-white p-4 shadow-[0_8px_24px_-20px_rgba(15,118,110,0.65)] transition-shadow duration-300 hover:shadow-md sm:max-w-[82%]" key={message.id}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="font-semibold text-teal-800">{message.author_handle}</span>
              <time className="shrink-0 text-xs text-slate-400" dateTime={message.created_at}>{new Date(message.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time>
            </div>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{message.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {message.reactions?.map((reaction) => (
                <button aria-label={`${REACTION_ICONS[reaction.emoji]?.label || "Reaction"}: ${reaction.count}`} className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs text-teal-800 transition-colors hover:bg-teal-100" key={reaction.emoji} onClick={() => react(message.id, reaction.emoji)} type="button">
                  {(() => {
                    const ReactionIcon = REACTION_ICONS[reaction.emoji]?.Icon || Heart;
                    return <ReactionIcon aria-hidden="true" size={14} />;
                  })()}
                  {reaction.count}
                </button>
              ))}
              {REACTIONS.map(({ value, label, Icon }) => (
                <button aria-label={`React with ${label}`} className="rounded-full p-1.5 text-slate-400 transition duration-200 hover:-translate-y-0.5 hover:bg-teal-50 hover:text-teal-700" key={value} onClick={() => react(message.id, value)} title={label} type="button">
                  <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                </button>
              ))}
            </div>
          </article>
        ))}
        <div ref={tailRef} />
      </div>

      <form className="flex gap-3 border-t border-teal-100 bg-white p-4 sm:p-5" onSubmit={sendMessage}>
        <input
          aria-label="Write a chat message"
          className="min-w-0 flex-1 rounded-2xl border border-teal-100 bg-teal-50/40 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          maxLength={4000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write something kind..."
          value={draft}
        />
        <button className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50" disabled={!draft.trim() || connection !== "connected"} type="submit">Send <Send aria-hidden="true" size={15} /></button>
      </form>
      <p className="px-5 pb-4 text-xs text-slate-400">Please avoid sharing private contact details. Be gentle with yourself and one another.</p>
    </section>
  );
}
