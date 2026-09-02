import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send, Loader2, X, MessageSquare } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement, consumeAiMessage } from "@/lib/ai.functions";
import { PacmanGhost } from "./PacmanGhost";
import { PlansInline } from "./PlansInline";

export interface AIChatBoxProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Floating AI Chat Box component
 * - Can be toggled open/closed
 * - Shows Pacman ghost as avatar
 * - Integrates with existing AI chat functionality
 */
export function AIChatBox({ isOpen, onToggle }: AIChatBoxProps) {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status, setMessages } = useChat({
    id: "floating-ai",
    transport: transport.current,
    onError: (e) => setError(e.message || "The assistant could not respond. Please try again."),
  });
  const [input, setInput] = useState("");
  const [entitlement, setEntitlement] = useState<{ hasActiveSub: boolean; freeRemaining: number; canSend: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useServerFn(getAiEntitlement);
  const consume = useServerFn(consumeAiMessage);
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize entitlement check
  useEffect(() => {
    refresh()
      .then((r) => setEntitlement({ hasActiveSub: r.hasActiveSub, freeRemaining: r.freeRemaining, canSend: r.canSend }))
      .catch(() => {});
  }, [refresh]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    const r = await consume();
    if (!r.ok) { 
      setEntitlement((e) => e && { ...e, canSend: false, freeRemaining: 0 }); 
      return; 
    }
    setInput("");
    sendMessage({ text });
  }

  function clearChat() {
    setMessages([]);
    setInput("");
    setError(null);
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-primary/20 border border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/30 transition-all shadow-lg hover:shadow-xl"
        aria-label="Open AI Chat"
      >
        <PacmanGhost size={20} />
        <span className="hidden sm:inline">Ask AI</span>
        <MessageSquare className="h-4 w-4" />
      </button>
    );
  }

  return (
    <>
      {/* Floating toggle button (still visible when open) */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary/20 border border-primary/40 px-4 py-2 text-sm text-primary hover:bg-primary/30 transition-all shadow-lg hover:shadow-xl"
        aria-label="Close AI Chat"
      >
        <PacmanGhost size={20} />
        <span className="hidden sm:inline">Close</span>
        <X className="h-4 w-4" />
      </button>

      {/* Chat box container */}
      <div className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 max-w-[90vw] h-96 max-h-[70vh] rounded-2xl card-glass border border-primary/30 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <PacmanGhost size={28} />
            <div>
              <h3 className="font-semibold text-sm">LTCme AI</h3>
              <p className="text-xs text-muted-foreground">Litecoin companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entitlement && (
              <div className="text-xs text-muted-foreground">
                {entitlement.hasActiveSub ? (
                  <span className="text-primary">Pro</span>
                ) : entitlement.freeRemaining > 0 ? (
                  <span>{entitlement.freeRemaining} left</span>
                ) : (
                  <span className="text-destructive">Limit reached</span>
                )}
              </div>
            )}
            <button
              onClick={clearChat}
              className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/70 hover:text-destructive transition"
              aria-label="Clear chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <PacmanGhost size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Ask me about Litecoin</p>
              <p className="text-xs mt-1 text-muted-foreground/70">
                Protocol, wallets, fees, MWEB, safety
              </p>
              <p className="text-xs mt-2 text-muted-foreground/50">
                I'll never ask for your seed phrase
              </p>
            </div>
          )}
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user" 
                    ? "bg-primary/20 text-primary-foreground border border-primary/30" 
                    : "card-glass border border-border/40"
                }`}
              >
                {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2.5 text-sm card-glass border border-border/40">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-border/60">
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive mb-2">
              {error}
            </div>
          )}
          {!(entitlement && !entitlement.canSend) && (
            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-2">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                disabled={busy} 
                placeholder="Ask about Litecoin..."
                className="flex-1 rounded-full bg-input/80 border border-border/60 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70"
              />
              <button 
                type="submit" 
                disabled={busy || !input.trim()}
                className="rounded-full bg-primary text-primary-foreground h-10 w-10 flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          )}
          {entitlement && !entitlement.hasActiveSub && entitlement.freeRemaining === 0 && (
            <div className="mt-2">
              <PlansInline compact />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
