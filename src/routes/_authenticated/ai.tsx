import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Sparkles, Send, Loader2, ArrowLeft, MessageSquare, X, Copy } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { getAiEntitlement, consumeAiMessage } from "@/lib/ai.functions";
import { PlansInline } from "@/components/PlansInline";
import { PacmanGhost } from "@/components/PacmanGhost";

export const Route = createFileRoute("/_authenticated/ai")({
  head: () => ({
    meta: [
      { title: "LTCme AI  LTCme.click" },
      { name: "description", content: "Chat with LTCme AI, a built-in Litecoin expert. Ask about transactions, fees, self-custody, and Litecoin best practices." },
      { property: "og:title", content: "LTCme AI  Litecoin expert chat" },
      { property: "og:description", content: "Chat with LTCme AI, a built-in Litecoin expert. Ask about transactions, fees, self-custody, and Litecoin best practices." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AiPage,
});

function AiPage() {
  const transport = useRef(new DefaultChatTransport({ api: "/api/chat" }));
  const { messages, sendMessage, status, setMessages } = useChat({
    id: "ai-page",
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

  useEffect(() => {
    refresh()
      .then((r) => setEntitlement({ hasActiveSub: r.hasActiveSub, freeRemaining: r.freeRemaining, canSend: r.canSend }))
      .catch(() => {});
  }, [refresh]);
  
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

  // Example messages to help users get started
  const exampleQuestions = [
    "What is Litecoin?",
    "How do I send LTC?",
    "What are MWEB transactions?",
    "How do I secure my wallet?",
    "What's the current fee rate?",
    "How does multisig work?",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 hairline bg-background/80 backdrop-blur-xl">
        <div className="px-4 md:px-6 py-3 flex items-center gap-4">
          <Link to="/wallets" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <PacmanGhost size={32} />
            <div>
              <h1 className="text-xl font-bold">LTCme AI</h1>
              <p className="text-xs text-muted-foreground">Your Litecoin expert companion</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
        <div className="rounded-2xl card-glass border border-primary/30 h-full flex flex-col">
          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <PacmanGhost size={64} className="mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-bold gradient-text mb-3">Hello! I'm LTCme AI</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  I'm your personal Litecoin expert. Ask me about the Litecoin protocol, wallet security,
                  transaction fees, MWEB, or anything else related to Litecoin and self-custody.
                </p>
                <p className="text-xs text-muted-foreground/60 mb-8">
                  I'll never ask for your seed phrase or private keys. Your keys, your coins.
                </p>
                
                {/* Example questions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {exampleQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-left rounded-xl border border-border/60 bg-background/40 hover:border-primary/40 hover:bg-primary/5 px-4 py-3 text-sm transition text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="h-4 w-4 mr-2 inline opacity-50" />
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div 
                  className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm whitespace-pre-wrap ${
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
                <div className="rounded-2xl px-5 py-3 text-sm card-glass border border-border/40">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-border/60">
            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-3 flex items-center gap-2">
                <X className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {entitlement && (
                  <div className="text-xs text-muted-foreground">
                    {entitlement.hasActiveSub ? (
                      <span className="text-primary font-medium">
                        <Sparkles className="h-3 w-3 inline mr-0.5" />
                        Pro - Unlimited
                      </span>
                    ) : entitlement.freeRemaining > 0 ? (
                      <span>
                        <MessageSquare className="h-3 w-3 inline mr-0.5 opacity-50" />
                        {entitlement.freeRemaining} free messages left
                      </span>
                    ) : (
                      <span className="text-destructive">
                        Free messages used
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={clearChat}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
            
            {!(entitlement && !entitlement.canSend) ? (
              <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex gap-3">
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  disabled={busy} 
                  placeholder="Ask me about Litecoin..."
                  className="flex-1 rounded-full bg-input/80 border border-border/60 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70 disabled:opacity-50"
                />
                <button 
                  type="submit" 
                  disabled={busy || !input.trim()}
                  className="rounded-full bg-primary text-primary-foreground h-12 w-12 flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition shadow-lg shadow-primary/20"
                >
                  {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  You've used your free messages. Upgrade to Pro for unlimited access.
                </p>
                <PlansInline compact />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
