import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LTCme.click" },
      { name: "description", content: "How LTCme.click handles data. Keys are generated and encrypted in your browser." },
      { property: "og:title", content: "Privacy Policy — LTCme.click" },
      { property: "og:description", content: "How LTCme.click handles data. Keys are generated and encrypted in your browser." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen px-6 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold">Privacy Policy</h1>
        <p className="text-xs text-muted-foreground mt-2">Last updated: 2026</p>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-foreground text-lg font-semibold">Your keys never leave your browser.</h2>
          <p>
            Your seed phrase and private keys are generated on your device, encrypted with a password you choose, and stored in this browser's local storage. LTCme.click does not receive, store, or have the ability to recover them.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Account data.</h2>
          <p>
            To sign in we use Google OAuth via our authentication provider. We store your email address and a user identifier so we can associate AI usage and subscription state with your account. We do not sell or share this data.
          </p>

          <h2 className="text-foreground text-lg font-semibold">AI assistant.</h2>
          <p>
            When you use the AI assistant, the messages you send are transmitted to our AI gateway to generate a response. We log usage counts to enforce your plan limits. Do not paste seed phrases, private keys, or other secrets into the assistant.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Blockchain data.</h2>
          <p>
            To show balances, transactions, and fee estimates, your addresses are queried against public Litecoin block explorers and network APIs. These third parties may log the queries.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Cookies & analytics.</h2>
          <p>
            We use only the cookies and local storage required for the app to function (auth session and encrypted wallet storage). We do not use advertising trackers.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Payments.</h2>
          <p>
            If you subscribe with a card, payments are processed by Stripe. We do not store full card numbers. Refer to Stripe's privacy policy for their handling of payment data.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Data requests.</h2>
          <p>
            To request deletion of your account data, contact us through the <Link to="/support" className="text-primary hover:underline">Support</Link> page.
          </p>
        </div>
      </div>
    </div>
  );
}