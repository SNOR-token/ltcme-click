import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement, consumeAiMessage } from "@/lib/ai.functions";
import { PlansInline } from "@/components/PlansInline";
import { supabase } from "@/integrations/supabase/client";

export function AiSidebar() {
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
    let cancelled = false;
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return; // don't call protected fn while signed out
      try {
        const r = await refresh();
        if (!cancelled) setEntitlement(r);
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

  return (
    <aside className="hidden md:flex fixed inset-y-0 right-0 z-30 w-[30%] min-w-[320px] bg-card/95 backdrop-blur-md border-l border-border flex-col">
          <header className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-tight">LTCme AI</div>
                <div className="text-[11px] text-muted-foreground">Litecoin companion</div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-10">
                Ask me anything about Litecoin — protocol, wallets, fees, MWEB, addresses.
                <div className="mt-3 text-xs">I never ask for your seed phrase.</div>
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text}</span> : null))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-3 space-y-2">
            {entitlement && !entitlement.hasActiveSub && (
              <div className="text-[11px] text-muted-foreground">
                {Math.max(0, entitlement.freeLimit - entitlement.freeUsed)} of {entitlement.freeLimit} free messages left
              </div>
            )}
            {!(entitlement && !entitlement.canSend && !entitlement.hasActiveSub) && (
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
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
            {entitlement && !entitlement.hasActiveSub && <PlansInline compact />}
            <p className="text-[10px] text-muted-foreground text-center">Never share your seed phrase with anyone.</p>
          </div>
    </aside>
  );
}