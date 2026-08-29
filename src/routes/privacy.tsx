import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — LTCme.click" },
      { name: "description", content: "How LTCme.click handles data. Keys are generated and encrypted in your browser." },
      { property: "og:title", content: "Privacy Policy — LTCme.click" },
      { property: "og:description", content: "How LTCme.click handles data. Keys are generated and encrypted in your browser." },
      { property: "og:url", content: "https://ltcme.click/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://ltcme.click/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">Privacy Policy</h1>
          <p className="text-xs text-muted-foreground mt-2">Last updated: August 29, 2026</p>
        </div>

        <div className="mt-4 neon-rule" />

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            This Privacy Policy explains what information LTCme.click ("we," "us") collects, how we use it, and the choices you have. LTCme.click is a non-custodial Litecoin wallet: we never receive or store your private keys, seed phrase, or passphrase. By using the service you agree to the practices described here.
          </p>

          <h2 className="text-foreground text-lg font-semibold">1. Your keys never leave your browser.</h2>
          <p>
            Your seed phrase and private keys are generated on your device and stored in this browser's local storage. They are not encrypted at rest by the app — anyone with access to this browser profile can read them, so use a device you trust and back up your seed phrase yourself. You may optionally add a BIP39 passphrase (25th word) as an extra secret. LTCme.click does not receive, store, transmit, or have the ability to recover your keys.
          </p>

          <h2 className="text-foreground text-lg font-semibold">2. Information we collect.</h2>
          <p>
            <strong className="text-foreground">Account data.</strong> To sign in we use Google OAuth via our authentication provider. We store your email address and a user identifier so we can associate AI usage and subscription state with your account. <strong className="text-foreground">Usage data.</strong> We log aggregate counts of AI messages to enforce your plan limits and basic technical logs (timestamps, request size) for security and reliability. <strong className="text-foreground">Blockchain queries.</strong> To show balances, transactions, and fee estimates, your Litecoin addresses are queried against public block explorers and network APIs; those third parties may log the queries. We do not sell or share your personal data.
          </p>

          <h2 className="text-foreground text-lg font-semibold">3. How we use your information.</h2>
          <p>
            We use your data to: provide and operate the wallet and AI assistant; authenticate you; manage subscriptions and billing; enforce plan limits; maintain security and prevent fraud or abuse; and comply with legal obligations. We do not use your data to build advertising profiles or sell it to third parties.
          </p>

          <h2 className="text-foreground text-lg font-semibold">4. AI assistant.</h2>
          <p>
            When you use the AI assistant, the messages you send are transmitted to our AI gateway to generate a response. We log usage counts to enforce your plan limits. Do not paste seed phrases, private keys, passwords, or other secrets into the assistant. AI model providers may retain prompts according to their own policies; see the relevant provider terms.
          </p>

          <h2 className="text-foreground text-lg font-semibold">5. Payments.</h2>
          <p>
            If you subscribe with a card, payments are processed by Stripe. We do not store full card numbers. Refer to Stripe's privacy policy for their handling of payment data. Crypto subscription payments are on-chain Litecoin transactions and are visible on the public Litecoin network.
          </p>

          <h2 className="text-foreground text-lg font-semibold">6. Data retention.</h2>
          <p>
            We keep your account data (email, user ID, subscription state, and AI usage counts) for as long as your account is active and for a reasonable period afterward to comply with legal, tax, and accounting obligations. Wallet keys and seed phrases are never retained by us. You can request deletion of your account data at any time; some records may be retained where required by law.
          </p>

          <h2 className="text-foreground text-lg font-semibold">7. Cookies & local storage.</h2>
          <p>
            We use only the cookies and local storage required for the app to function (auth session and local wallet storage). We do not use advertising trackers, advertising cookies, or cross-site tracking pixels. Google may set cookies for the conversion tags used on our site; see Google's privacy policy for details.
          </p>

          <h2 className="text-foreground text-lg font-semibold">8. Security.</h2>
          <p>
            We use reasonable technical and organizational measures to protect account and usage data, such as encryption in transit (TLS) and access controls. However, no system is perfectly secure. Because your keys live in your browser, the security of your device, browser, and backups is the single most important factor in protecting your funds.
          </p>

          <h2 className="text-foreground text-lg font-semibold">9. Data breach notification.</h2>
          <p>
            In the event of a breach of personal data we hold, we will take steps to investigate, contain, and notify affected users and regulators as required by applicable law, without undue delay.
          </p>

          <h2 className="text-foreground text-lg font-semibold">10. International transfers.</h2>
          <p>
            Your data may be processed or stored in the United States or other countries where our providers operate. If you access LTCme.click from outside the U.S., you understand that your data is transferred to and processed in the U.S. and other jurisdictions whose data-protection laws may differ from yours.
          </p>

          <h2 className="text-foreground text-lg font-semibold">11. Children's privacy.</h2>
          <p>
            LTCme.click is not directed to anyone under 18 and we do not knowingly collect personal information from children. If you believe a minor has provided us personal data, contact us and we will delete it.
          </p>

          <h2 className="text-foreground text-lg font-semibold">12. Your privacy rights (U.S. state laws).</h2>
          <p>
            If you are a resident of California (CCPA/CPRA), Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA), Utah (UCPA), or another state with a consumer privacy law, you may have rights to know, access, correct, delete, or limit the use and sale of your personal information. <strong className="text-foreground">We do not sell your personal information</strong> and have not sold it in the past 12 months. To exercise any right, contact us through the Support page; we will verify your identity before responding.
          </p>

          <h2 className="text-foreground text-lg font-semibold">13. Financial privacy (GLBA notice).</h2>
          <p>
            LTCme.click is a non-custodial tool and does not hold customer funds, so it is not a "financial institution" that collects "nonpublic personal information" in the traditional Gramm-Leach-Bliley Act (GLBA) sense. We nonetheless limit collection to the data described in this policy and do not share it with non-affiliated third parties for their own marketing. Any on-ramp/off-ramp partner that handles regulated financial activity provides its own GLBA privacy notice where required.
          </p>

          <h2 className="text-foreground text-lg font-semibold">14. Do Not Track.</h2>
          <p>
            We do not currently respond to "Do Not Track" browser signals because we do not engage in cross-site behavioral tracking.
          </p>

          <h2 className="text-foreground text-lg font-semibold">15. Changes to this policy.</h2>
          <p>
            We may update this Privacy Policy from time to time and will post changes here with a new "Last updated" date.
          </p>

          <div className="mt-8 neon-rule" />
          <p className="text-xs pt-6">
            To request access, correction, or deletion of your account data, contact us through the <Link to="/support" className="text-primary hover:underline">Support</Link> page or email <a className="text-primary hover:underline" href="mailto:support@ltcme.click">support@ltcme.click</a>. See also our <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
