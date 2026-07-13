import { createFileRoute, Link } from "@tanstack/react-router";
import { Wallet, Sparkles, Shield, Send, Wrench, ArrowRight, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/60 backdrop-blur-md sticky top-0 z-20 bg-background/40">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <LogoMark />
            <span className="font-semibold tracking-tight">LTCme.click</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#security" className="hover:text-foreground">Security</a>
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
          </nav>
          <Link
            to="/auth"
            className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium btn-glow hover:opacity-90 transition"
          >
            Sign in
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          Litecoin's first AI-powered wallet
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="gradient-text">Your Litecoin,</span>
          <br />
          made effortless.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Non-custodial. Multi-wallet. Built-in AI companion that actually knows Litecoin.
          Send, receive, and manage LTC on mainnet — keys never leave your device.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/auth"
            className="rounded-full bg-primary text-primary-foreground px-6 py-3 font-medium btn-glow hover:opacity-90 transition inline-flex items-center gap-2"
          >
            Open wallet <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/pricing"
            className="rounded-full border border-border bg-card/60 px-6 py-3 font-medium hover:bg-card transition"
          >
            See AI plans
          </Link>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature icon={<Wallet />} title="Multi-wallet import" body="Generate a fresh seed or import unlimited wallets — mnemonic, WIF, or watch-only xpub." />
          <Feature icon={<Shield />} title="Non-custodial" body="Keys are encrypted with your password and stored in your browser. We never see them." />
          <Feature icon={<Sparkles />} title="LTCme AI" body="Ask a Litecoin-expert AI anything about LTC — protocol, MWEB, addresses, fees, safety." />
          <Feature icon={<Send />} title="Send & receive" body="Live balances, mempool-aware fees, and clean SegWit (ltc1...) transactions on mainnet." />
          <Feature icon={<Wrench />} title="Power tools" body="TX builder, address validator, WIF → address, mnemonic derivation, message signing." />
          <Feature icon={<Zap />} title="Fast & light" body="No accounts to sync, no downloads. Open the page, unlock, done." />
        </div>
      </section>

      <section id="security" className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <h2 className="text-3xl font-bold">Mainnet-ready. Beta mindset.</h2>
        <p className="mt-4 text-muted-foreground">
          LTCme.click uses BIP39 / BIP84 with Litecoin mainnet parameters and AES-GCM
          password encryption via WebCrypto. Your seed phrase and private keys are
          derived and signed entirely in your browser. Start with small amounts,
          always back up your recovery phrase, and never share it — not even with the AI.
        </p>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        LTCme.click — not affiliated with the Litecoin Foundation. Use at your own risk.
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ltcg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.14 230)" />
          <stop offset="100%" stopColor="oklch(0.88 0.11 220)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#ltcg)" />
      <path d="M15.2 11h4.4l-1.8 8.2 3.5-1 -0.7 3 -3.5 1 -0.9 4.1H26v3.4H12.6l1.6-7.4 -2.6 0.7 0.7-3 2.6-0.7L15.2 11z" fill="oklch(0.14 0.04 240)" />
    </svg>
  );
}
