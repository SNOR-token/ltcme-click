import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send, Loader2, ShieldCheck, Lock } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement, consumeAiMessage } from "@/lib/ai.functions";
import { PlansInline } from "@/components/PlansInline";
import { supabase } from "@/integrations/supabase/client";

type Entitlement = {
  hasActiveSub: boolean;
  freeRemaining: number;
  freeLimit: number;
  canSend: boolean;
};

export function AiSidebar() {
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useServerFn(getAiEntitlement);
  const consume = useServerFn(consumeAiMessage);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [input, setInput] = useState("");
  const transport = useRef(
    new DefaultChatTransport({
      api: "/api/chat",
      headers: async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        const headers: Record<string, string> = {};
        if (data.session) headers.Authorization = `Bearer ${data.session.access_token}`;
        return headers;
      },
    }),
  );
  const { messages, sendMessage, status } = useChat({
    id: "sidebar-chat",
    transport: transport.current,
    onError: (e) => setError(e.message || "The assistant could not respond. Please try again."),
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return; // don't call protected fn while signed out
      try {
        const r = await refresh();
        if (!cancelled)
          setEntitlement({
            hasActiveSub: r.hasActiveSub,
            freeRemaining: r.freeRemaining,
            freeLimit: r.freeLimit ?? 10,
            canSend: r.canSend,
          });
      } catch {
        /* ignore */
      }
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") load();
      if (event === "SIGNED_OUT") setEntitlement(null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [refresh]);

  // Auto-scroll the conversation to the bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";
  const limit = entitlement?.freeLimit ?? 10;
  const used = limit - (entitlement?.freeRemaining ?? limit);
  const locked = entitlement && !entitlement.canSend;

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

  return (
    <aside className="hidden md:flex fixed inset-y-0 right-0 z-30 w-[40%] min-w-[440px] max-w-[640px] flex-col border-l border-border ai-sidebar-glow">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-border/70 ai-sidebar-header">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center btn-glow">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-semibold leading-tight">LTCme AI</div>
            <div className="text-xs text-muted-foreground">Litecoin companion</div>
          </div>
        </div>
        {entitlement && (
          <div className="text-xs text-muted-foreground text-right">
            {entitlement.hasActiveSub ? (
              <span className="text-primary">Unlimited</span>
            ) : entitlement.freeRemaining > 0 ? (
              <span>{used} / {limit} free used</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-primary"><Lock className="h-3 w-3" /> Locked</span>
            )}
          </div>
        )}
      </header>

      {/* Conversation — large scrollable window above the prompt */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5 ai-conversation">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-16">
            <div className="mx-auto mb-4 h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center btn-glow">
              <Sparkles className="h-6 w-6" />
            </div>
            Ask me anything about Litecoin — protocol, wallets, fees, MWEB, addresses.
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> I never ask for your seed phrase
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`inline-block max-w-[88%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground btn-glow" : "card-glass"}`}
            >
              {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-2xl card-glass px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>

      {/* Prompt + paywall */}
      <div className="border-t border-border/70 p-4 space-y-3">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            {error}
          </div>
        )}

        {entitlement && !entitlement.hasActiveSub && entitlement.freeRemaining > 0 && (
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>{entitlement.freeRemaining} free {entitlement.freeRemaining === 1 ? "message" : "messages"} left</span>
            <span>{used} / {limit} used</span>
          </div>
        )}

        {!locked && (
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
              className="flex-1 rounded-full bg-input border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-full bg-primary text-primary-foreground h-11 w-11 flex items-center justify-center disabled:opacity-50 btn-glow"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </form>
        )}

        {/* Paywall: full pricing panel shown when free messages are used up */}
        {locked && <PlansInline />}

        <p className="text-[10px] text-muted-foreground text-center">
          {entitlement?.hasActiveSub
            ? "Never share your seed phrase with anyone."
            : "Pro unlocks unlimited AI + advanced wallet tools."}
        </p>
      </div>
    </aside>
  );
}
