import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send, Lock, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement, consumeAiMessage } from "@/lib/ai.functions";

/**
 * Persistent right-column LTCme AI panel.
 * Always visible on lg+ screens. Collapsible via a chevron toggle.
 */
export function AiPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [entitlement, setEntitlement] = useState<{
    freeUsed: number;
    freeLimit: number;
    hasActiveSub: boolean;
    canSend: boolean;
  } | null>(null);
  const refresh = useServerFn(getAiEntitlement);
  const consume = useServerFn(consumeAiMessage);

  const [input, setInput] = useState("");
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status } = useChat({
    id: "sidebar-chat",
    transport: transport.current,
    onError: (e) => console.error("chat error", e),
  });

  useEffect(() => {
    refresh().then(setEntitlement).catch(() => {});
  }, [refresh]);

  const busy = status === "submitted" || status === "streaming";

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    const r = await consume();
    if (!r.ok) {
      setEntitlement((e) => e && { ...e, canSend: false });
      return;
    }
    setEntitlement((e) => e && { ...e, freeUsed: r.freeUsed, canSend: e.hasActiveSub || r.freeUsed < r.freeLimit });
    setInput("");
    sendMessage({ text });
  }

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="hidden lg:flex fixed right-3 top-1/2 -translate-y-1/2 z-30 h-16 w-8 rounded-l-2xl bg-primary text-primary-foreground items-center justify-center btn-glow"
        aria-label="Open LTCme AI"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="hidden lg:flex w-[360px] shrink-0 flex-col border-l border-border/60 bg-sidebar/70 backdrop-blur-md sticky top-0 h-screen">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">LTCme AI</div>
            <div className="text-[11px] text-muted-foreground">Litecoin companion</div>
          </div>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Collapse LTCme AI"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-sm text-muted-foreground py-6 space-y-3">
            <p>Ask me anything Litecoin — protocol, MWEB, fees, addresses, wallet tips.</p>
            <div className="grid gap-2">
              {[
                "What is MWEB and should I use it?",
                "How do I estimate a safe LTC fee right now?",
                "Explain ltc1, M and L address types.",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-xs rounded-xl border border-border bg-card/50 px-3 py-2 hover:bg-card"
                >
                  {q}
                </button>
              ))}
            </div>
            <p className="text-[11px]">I will never ask for your seed phrase.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
            </div>
          </div>
        ))}
        {busy && (
          <div className="text-xs text-muted-foreground">LTCme is thinking…</div>
        )}
      </div>

      <div className="border-t border-border/60 p-3 space-y-2">
        {entitlement && !entitlement.hasActiveSub && (
          <div className="text-[11px] text-muted-foreground flex items-center justify-between">
            <span>
              {Math.max(0, entitlement.freeLimit - entitlement.freeUsed)} of {entitlement.freeLimit} free messages left
            </span>
            <Link to="/pricing" className="text-primary hover:underline">Upgrade</Link>
          </div>
        )}
        {entitlement && !entitlement.canSend && !entitlement.hasActiveSub ? (
          <Link
            to="/pricing"
            className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium btn-glow"
          >
            <Lock className="h-4 w-4" /> Unlock unlimited AI — from $4.99
          </Link>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask LTCme AI…"
              disabled={busy}
              className="flex-1 rounded-full bg-input border border-border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-primary text-primary-foreground h-9 w-9 flex items-center justify-center disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        )}
        <p className="text-[10px] text-muted-foreground text-center">Never share your seed phrase.</p>
      </div>
    </aside>
  );
}