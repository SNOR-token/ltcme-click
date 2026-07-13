import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send, Loader2, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement, consumeAiMessage } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({ meta: [{ title: "LTCme AI — LTCme.click" }] }),
  component: AiPage,
});

function AiPage() {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status } = useChat({ id: "main-ai", transport: transport.current });
  const [input, setInput] = useState("");
  const [entitlement, setEntitlement] = useState<{ freeUsed: number; freeLimit: number; hasActiveSub: boolean; canSend: boolean } | null>(null);
  const refresh = useServerFn(getAiEntitlement);
  const consume = useServerFn(consumeAiMessage);
  const busy = status === "submitted" || status === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { refresh().then(setEntitlement).catch(() => {}); }, [refresh]);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function submit() {
    const text = input.trim();
    if (!text || busy) return;
    const r = await consume();
    if (!r.ok) { setEntitlement((e) => e && { ...e, canSend: false }); return; }
    setEntitlement((e) => e && { ...e, freeUsed: r.freeUsed, canSend: e.hasActiveSub || r.freeUsed < r.freeLimit });
    setInput("");
    sendMessage({ text });
  }

  return (
    <div className="h-screen flex flex-col max-w-4xl mx-auto">
      <header className="p-6 border-b border-border/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <Sparkles />
          </div>
          <div>
            <h1 className="text-xl font-bold">LTCme AI</h1>
            <p className="text-xs text-muted-foreground">Litecoin's AI companion</p>
          </div>
        </div>
        {entitlement && (
          <div className="text-xs text-muted-foreground">
            {entitlement.hasActiveSub ? (
              <span className="text-primary">Unlimited</span>
            ) : (
              <span>{Math.max(0, entitlement.freeLimit - entitlement.freeUsed)} / {entitlement.freeLimit} free left</span>
            )}
          </div>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-20">
            <Sparkles className="h-8 w-8 mx-auto text-primary mb-3" />
            <p>Ask me about Litecoin. Protocol, wallets, fees, MWEB, safety.</p>
            <p className="text-xs mt-2">I'll never ask for your seed phrase.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : ""}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "card-glass"}`}>
              {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border/60">
        {entitlement && !entitlement.canSend ? (
          <Link to="/pricing" className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-medium btn-glow">
            <Lock className="h-4 w-4" /> You've used your 5 free messages — unlock unlimited from $4.99
          </Link>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} disabled={busy} placeholder="Ask LTCme AI…" className="flex-1 rounded-full bg-input border border-border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <button type="submit" disabled={busy || !input.trim()} className="rounded-full bg-primary text-primary-foreground h-11 w-11 flex items-center justify-center disabled:opacity-50">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}