import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — LTCme.click" },
      { name: "description", content: "Terms of Service for LTCme.click, a non-custodial Litecoin wallet." },
      { property: "og:title", content: "Terms of Service — LTCme.click" },
      { property: "og:description", content: "Terms of Service for LTCme.click, a non-custodial Litecoin wallet." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen px-6 py-12 md:py-16">
      <div className="max-w-3xl mx-auto">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-4 text-3xl md:text-4xl font-bold">Terms of Service</h1>
        <p className="text-xs text-muted-foreground mt-2">Last updated: 2026</p>

        <div className="prose prose-invert mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Disclaimer.</strong> LTCme.click is a non-custodial software tool provided "as is" without warranties of any kind. You alone control your seed phrase, private keys, and funds. LTCme.click, its operators, owners, employees, and affiliates accept no liability for any loss, theft, damage, tax consequence, missed transaction, network failure, third-party service outage, user error, or any direct, indirect, incidental, consequential, or punitive damages arising from use of this site, the wallet, the AI assistant, or any linked service. Nothing here is financial, legal, tax, or investment advice. Litecoin transactions are irreversible. Use at your own risk. By using LTCme.click you release and hold harmless the operator and its company from any and all claims relating to loss of funds or legal matters, to the fullest extent permitted by law.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Important — please read.</h2>
          <p>
            LTCme.click is a non-custodial, self-hosted Litecoin wallet. We do not hold, control, or have access to your private keys, seed phrase, or funds. You — and only you — are responsible for safely backing up your seed phrase. Lost seed phrases cannot be recovered.
          </p>

          <h2 className="text-foreground text-lg font-semibold">No financial advice.</h2>
          <p>
            Nothing in this app constitutes investment, legal, tax, or financial advice. Litecoin is volatile and you can lose 100% of what you send. Always verify recipient addresses; on-chain Litecoin transactions are irreversible.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Fees.</h2>
          <p>
            A service fee of 0.1% of the send amount is paid to the LTCme.click operator as a separate output on every on-chain send, bundled dynamically with the broadcast transaction (never charged in advance). Litecoin network (miner) fees are paid separately to the Litecoin network.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Compliance & jurisdiction.</h2>
          <p>
            You are responsible for complying with the laws of your country, state, or jurisdiction — including but not limited to anti–money-laundering (AML), sanctions, securities, and tax-reporting rules. LTCme.click is provided "as is" without warranties of any kind. Do not use this app where prohibited by law.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Self-custody & key security.</h2>
          <p>
            You alone hold and control your private keys, seed phrase, and any optional BIP39 passphrase. We never see, store, transmit, or have the ability to recover them. If you lose your seed phrase, forget your encryption passphrase, or have them stolen (phishing, malware, screen capture, cloud backup of plaintext, shoulder surfing, etc.), your funds are gone permanently. Treat your seed phrase like cash: write it on paper or metal, store offline, never type it into a website, email, chat, photo, or password manager cloud sync, and never share it with anyone — including people claiming to be LTCme.click support. We will never ask for it.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Movement of funds & irreversibility.</h2>
          <p>
            Every Litecoin transaction you broadcast is final once confirmed. There is no chargeback, refund, undo, cancel, or customer-service reversal. Always verify the recipient address character-by-character (malware can swap clipboard contents), confirm the amount in both LTC and USD, and start with a small test send for new addresses or large amounts.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Third-party services & integrations.</h2>
          <p>
            Price quotes, blockchain data, mempool/fee estimates, and any external integrations rely on independent third parties we do not operate or control. Outages, incorrect data, censorship, address poisoning, or malicious responses from those services can affect what you see in this app. Do not treat any displayed balance, fee, or quote as guaranteed.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Subscriptions & payments.</h2>
          <p>
            Card payments, where offered, are processed by Stripe. Crypto payments are non-refundable once confirmed. Card subscriptions can be managed or canceled from the billing page. We do not store full card numbers.
          </p>

          <h2 className="text-foreground text-lg font-semibold">Open networks.</h2>
          <p>
            Litecoin addresses and transactions route through public, third-party infrastructure. We do not operate these services and are not responsible for their availability or behavior.
          </p>

          <p className="pt-4 text-foreground">
            By using LTCme.click you acknowledge and accept these terms and the risks of self-custody.
          </p>

          <p className="text-xs pt-8">
            See also <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/support" className="text-primary hover:underline">Support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}