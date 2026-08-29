import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — LTCme.click" },
      { name: "description", content: "Get help with LTCme.click. Read our self-custody safety guide and contact us." },
      { property: "og:title", content: "Support — LTCme.click" },
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

function SupportPage() {
  return (
    <div className="min-h-screen px-6 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold">Support</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-foreground">
            <p className="text-sm font-semibold">We will never DM you or ask for your seed phrase.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Anyone asking for your seed phrase, private key, or BIP39 passphrase is trying to steal your funds. We cannot recover lost seeds or reverse transactions.
            </p>
          </div>

          <h2 className="text-foreground text-lg font-semibold">Common questions</h2>
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
            <p className="text-foreground font-medium">How do I pay for Heightened Security?</p>
            <p>
              Send the listed LTC amount to the official address shown on the paywall, wait for at least one
              confirmation, then paste the transaction id into "Verify payment &amp; activate". Each txid can only
              activate one account. We do not use card processors.
            </p>
          </div>
          <div>
            <p className="text-foreground font-medium">A transaction is stuck.</p>
            <p>Wait for network confirmation. If fees are too low, you may need to wait for congestion to clear. We cannot cancel broadcast transactions.</p>
          </div>

          <h2 className="text-foreground text-lg font-semibold">Contact</h2>
          <p>
            For non-urgent questions, email <a className="text-primary hover:underline" href="mailto:support@ltcme.click">support@ltcme.click</a>. Please include your account email and a description of the issue. Never include your seed phrase or private keys.
          </p>

          <p className="text-xs pt-8">
            See also <Link to="/terms" className="text-primary hover:underline">Terms</Link> and <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}