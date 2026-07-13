import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send, MessageCircle, X, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement, consumeAiMessage } from "@/lib/ai.functions";

export function AiSidebar() {
  const [open, setOpen] = useState(false);
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

  return (
    <>
      {/* Floating open button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-30 rounded-full bg-primary text-primary-foreground h-14 w-14 flex items-center justify-center btn-glow shadow-lg hover:opacity-90"
          aria-label="Open LTCme AI"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <aside className="fixed inset-y-0 right-0 z-30 w-full sm:w-96 bg-card/95 backdrop-blur-md border-l border-border flex flex-col">
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
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
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
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            )}
            <p className="text-[10px] text-muted-foreground text-center">Never share your seed phrase with anyone.</p>
          </div>
        </aside>
      )}
    </>
  );
}