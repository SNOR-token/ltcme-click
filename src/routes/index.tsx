import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import {
  ArrowRight,
  Bot,
  Download,
  ExternalLink,
  LockKeyhole,
  Newspaper,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: JournalLanding,
  head: () => ({
    meta: [
      { title: "LTCme.click Journal — Litecoin wallet, AI & security" },
      {
        name: "description",
        content:
          "The public home of LTCme.click: product journal, Android download, Litecoin wallet access, security notes and project updates.",
      },
      { property: "og:title", content: "LTCme.click Journal" },
      { property: "og:url", content: "https://ltcme.click/" },
      {
        property: "og:description",
        content:
          "Follow LTCme.click development, install the Android app, or open the self-custody Litecoin wallet.",
      },
    ],
    links: [{ rel: "canonical", href: "https://ltcme.click/" }],
  }),
});

function JournalLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/50 bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3" aria-label="LTCme.click home">
            <LogoMark size={40} />
            <div>
              <div className="text-lg font-semibold leading-none">
                LTCme<span className="text-primary">.click</span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                The Journal
              </div>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="https://presale.ltcme.click"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm hover:border-primary/60 transition"
            >
              Presale <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
            >
              Open Wallet <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-10 lg:gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                <Newspaper className="h-3.5 w-3.5" />
                LTCme.click Journal
              </div>
              <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.02]">
                Litecoin, self-custody,
                <span className="block gradient-text">and the software behind it.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
                This is the public front door to LTCme.click. Read project updates, install the Android app,
                review how the wallet is designed, or continue into the authenticated wallet when you are ready.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 font-medium hover:opacity-90 transition"
                >
                  <Wallet className="h-4 w-4" />
                  Open Web Wallet
                </Link>
                <Link
                  to="/download"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 font-medium hover:border-primary/60 transition"
                >
                  <Download className="h-4 w-4" />
                  Android Download
                </Link>
              </div>

              <div className="mt-8 grid sm:grid-cols-3 gap-3">
                {[
                  { icon: LockKeyhole, title: "Self-custody", text: "Wallet keys stay on your device." },
                  { icon: Bot, title: "AI assisted", text: "AI can explain and prepare; you approve and sign." },
                  { icon: ShieldCheck, title: "Litecoin focused", text: "Built around Litecoin mainnet workflows." },
                ].map((item) => (
                  <div key={item.title} className="card-glass rounded-2xl p-4">
                    <item.icon className="h-5 w-5 text-primary" />
                    <div className="mt-3 text-sm font-semibold">{item.title}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="card-glass neon-edge rounded-3xl p-7 md:p-8">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Take LTCme with you</h2>
                  <p className="text-xs text-muted-foreground">Scan to open the official download page.</p>
                </div>
              </div>

              <div className="mt-6 mx-auto w-fit rounded-3xl bg-white p-4 shadow-sm">
                <QRCodeSVG
                  value="https://ltcme.click/download"
                  size={220}
                  level="M"
                  includeMargin={false}
                  aria-label="QR code for the LTCme Android download page"
                />
              </div>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                QR destination: <span className="text-foreground">ltcme.click/download</span>
              </p>
              <Link
                to="/download"
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/40 px-5 py-3 text-sm font-medium hover:bg-primary/5 transition"
              >
                View Android Download <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        </section>

        <section className="border-y border-border/50 bg-muted/20">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="eyebrow">Journal notes</span>
                <h2 className="mt-2 text-2xl md:text-3xl font-bold">What LTCme is building</h2>
              </div>
              <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
                The wallet is the product; this page stays public so visitors can understand the project before signing in.
              </p>
            </div>

            <div className="mt-7 grid md:grid-cols-3 gap-4">
              <article className="card-glass rounded-2xl p-5">
                <span className="text-xs uppercase tracking-[0.18em] text-primary">Wallet</span>
                <h3 className="mt-2 font-semibold">A deliberate public-to-private flow</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Visiting LTCme.click no longer drops you into authentication. The Journal comes first; wallet access is an explicit action.
                </p>
              </article>
              <article className="card-glass rounded-2xl p-5">
                <span className="text-xs uppercase tracking-[0.18em] text-primary">Mobile</span>
                <h3 className="mt-2 font-semibold">One stable Android entry point</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  The QR always points to the LTCme download page, so the underlying APK can change later without replacing printed QR codes.
                </p>
              </article>
              <article className="card-glass rounded-2xl p-5">
                <span className="text-xs uppercase tracking-[0.18em] text-primary">Access</span>
                <h3 className="mt-2 font-semibold">Google or email, then wallet</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  The Open Wallet button goes to authentication. Successful sign-in then continues to the wallet dashboard.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-5 text-[11px] text-muted-foreground border-t border-border/40 neon-footer">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <span>© 2026 LTCme.click</span>
          <span className="flex items-center gap-4 flex-wrap">
            <Link to="/download" className="hover:text-foreground">Download</Link>
            <a href="https://presale.ltcme.click" target="_blank" rel="noreferrer" className="hover:text-foreground">Presale</a>
            <Link to="/support" className="hover:text-foreground">Support</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </span>
        </div>
      </footer>
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
