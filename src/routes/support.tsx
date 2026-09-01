import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, KeyRound, Eye, Download, RefreshCw, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support - LTCme.click" },
      { name: "description", content: "Get help with LTCme.click. Read our self-custody safety guide and contact us." },
      { property: "og:title", content: "Support - LTCme.click" },
      { property: "og:description", content: "Get help with LTCme.click. Read our self-custody safety guide and contact us." },
      { property: "og:url", content: "https://ltcme.click/support" },
    ],
    links: [{ rel: "canonical", href: "https://ltcme.click/support" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "I lost my seed phrase.",
              acceptedAnswer: { "@type": "Answer", text: "There is nothing we can do. Your funds are only recoverable with the 12/24-word seed you were shown at wallet creation." },
            },
            {
              "@type": "Question",
              name: "I forgot my encryption password.",
              acceptedAnswer: { "@type": "Answer", text: "Remove the wallet from this browser and re-import it from your seed phrase to set a new password." },
            },
            {
              "@type": "Question",
              name: "My import fails.",
              acceptedAnswer: { "@type": "Answer", text: "Make sure the input contains only your 12/24-word seed phrase (separated by single spaces) or a single WIF key. If your original wallet used a BIP39 passphrase, click 'Add optional BIP39 passphrase' during import." },
            },
            {
              "@type": "Question",
              name: "A transaction is stuck.",
              acceptedAnswer: { "@type": "Answer", text: "Wait for network confirmation. If fees are too low, you may need to wait for congestion to clear. We cannot cancel broadcast transactions." },
            },
          ],
        }),
      },
    ],
  }),
  component: SupportPage,
});

const safetyTips = [
  { icon: KeyRound, t: "Back up your seed phrase offline", d: "Write your 12/24-word seed on paper or metal and store it offline. Never save it as a photo, in email, in a password-manager cloud sync, or on a cloud drive." },
  { icon: ShieldCheck, t: "Never share your seed or passphrase", d: "No one from LTCme.click will ever ask for it. Anyone who does is trying to steal your funds - including fake support agents, DMs, or calls." },
  { icon: Eye, t: "Verify every address character-by-character", d: "Malware can silently swap a copied address in your clipboard. Always re-check the first and last several characters before sending, especially large amounts." },
  { icon: Download, t: "Test with a small send first", d: "For a new or unverified recipient, send a tiny test transaction first and confirm it arrives before sending the full amount." },
  { icon: RefreshCw, t: "Use a BIP39 passphrase (25th word)", d: "Adding a strong passphrase adds a second secret. Store it separately from your seed phrase; losing it means losing your funds." },
  { icon: AlertTriangle, t: "Watch for phishing and fake sites", d: "Bookmark ltcme.click. Check the URL bar before entering anything. Seed phrases entered into a fake site are drained instantly." },
];

function SupportPage() {
  return (
    <div className="min-h-screen px-6 py-12 md:py-16">
      <div className="relative max-w-3xl mx-auto card-glass rounded-3xl p-8 md:p-12 neon-page">
        <span className="neon-page-frame" />
        <span className="neon-corner border-t-2 border-l-2 rounded-tl-xl" style={{ top: "-1px", left: "-1px" }} />
        <span className="neon-corner border-t-2 border-r-2 rounded-tr-xl" style={{ top: "-1px", right: "-1px" }} />
        <span className="neon-corner border-b-2 border-l-2 rounded-bl-xl" style={{ bottom: "-1px", left: "-1px" }} />
        <span className="neon-corner border-b-2 border-r-2 rounded-br-xl" style={{ bottom: "-1px", right: "-1px" }} />

        <div className="relative neon-halo">
          <span className="neon-halo-glow" />
          <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">Support</h1>
        </div>

        <div className="mt-4 neon-rule" />

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-foreground">
            <p className="text-sm font-semibold">We will never DM you or ask for your seed phrase.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anyone asking for your seed phrase, private key, or BIP39 passphrase is trying to steal your funds. We cannot recover lost seeds or reverse transactions.
            </p>
          </div>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Crypto wallet security checklist</h2>
            <p className="mt-1 text-xs">A quick self-custody review. LTCme.click is non-custodial - your security is in your hands.</p>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {safetyTips.map((s) => (
                <div key={s.t} className="rounded-xl border border-border/70 bg-card/50 p-3.5">
                  <div className="flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{s.t}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Common questions</h2>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-foreground font-medium">I lost my seed phrase.</p>
                <p>There is nothing we can do. Your funds are only recoverable with the 12/24-word seed you were shown at wallet creation.</p>
              </div>
              <div>
                <p className="text-foreground font-medium">I forgot my encryption password.</p>
                <p>Remove the wallet from this browser and re-import it from your seed phrase to set a new password.</p>
              </div>
              <div>
                <p className="text-foreground font-medium">My import fails.</p>
                <p>Make sure the input contains only your 12/24-word seed phrase (separated by single spaces) or a single WIF key. If your original wallet used a BIP39 passphrase, click "Add optional BIP39 passphrase" during import.</p>
              </div>
              <div>
                <p className="text-foreground font-medium">A transaction is stuck.</p>
                <p>Wait for network confirmation. If fees are too low, you may need to wait for congestion to clear. We cannot cancel broadcast transactions.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-foreground text-lg font-semibold">Contact</h2>
            <p>
              For non-urgent questions, email <a className="text-primary hover:underline" href="mailto:support@ltcme.click">support@ltcme.click</a>. Please include your account email and a description of the issue. Never include your seed phrase or private keys.
            </p>
          </section>

          <div className="mt-2 neon-rule" />
          <p className="text-xs pt-6">
            See also <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}