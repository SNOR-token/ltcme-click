import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — LTCme.click" },
      { name: "description", content: "Terms of Service for LTCme.click, a non-custodial Litecoin wallet." },
      { property: "og:title", content: "Terms of Service — LTCme.click" },
      { property: "og:description", content: "Terms of Service for LTCme.click, a non-custodial Litecoin wallet." },
      { property: "og:url", content: "https://ltcme.click/terms" },
    ],
    links: [{ rel: "canonical", href: "https://ltcme.click/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
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
          <h1 className="mt-4 text-3xl md:text-4xl font-bold">Terms of Service</h1>
          <p className="text-xs text-muted-foreground mt-2">Last updated: August 29, 2026</p>
        </div>

        <div className="mt-4 neon-rule" />

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            <strong className="text-foreground">Important risk disclaimer.</strong> LTCme.click is a non-cust
odial, self-custody software tool provided "as is" and without warranties of any kind, express or implied. You alone control your seed phrase, private keys, and funds at all times. LTCme.click, its operators, owners, employees, and affiliates accept no liability for any loss, theft, damage, tax consequence, missed transaction, network failure, third-party service outage, user error, or any direct, indirect, incidental, consequential, special, or punitive damages arising from use of this site, the wallet, the AI assistant, or any linked service. Nothing here is financial, legal, tax, or investment advice. Litecoin transactions are irreversible. Use at your own risk. By using LTCme.click you release and hold harmless the operator and its affiliates from any and all claims relating to loss of funds or legal matters, to the fullest extent permitted by law.
          </p>

          <h2 className="text-foreground text-lg font-semibold">1. What LTCme.click is — and is not.</h2>
          <p>
            LTCme.click is a non-custodial, self-hosted Litecoin wallet. We do not hold, control, custody, transmit, exchange, or have access to your private keys, seed phrase, passphrase, or funds. The software generates and stores keys in your browser; you initiate, sign, and broadcast every transaction yourself. LTCme.click is software, not a financial institution, bank, exchange, broker-dealer, or custodian.
          </p>

          <h2 className="text-foreground text-lg font-semibold">2. Not a money transmitter or MSB.</h2>
          <p>
            Because LTCme.click never takes custody or control of your Litecoin, it does not operate as a money services business (MSB), money transmitter, or currency exchange under U.S. federal law, and does not register as such with FinCEN. You — the user — are the party initiating and controlling any transfer of value. LTCme.click simply displays data and helps you build and sign transactions locally. If any regulator or court ever determine
s that any function of this software constitutes money transmission, exchange, or another regulated activity, you acknowledge that LTCme.click is provided solely as a non-custodial software tool and that you, not LTCme.click, are the responsible party for any transaction. LTCme.click is not a registered money services business with the Financial Crimes Enforcement Network (FinCEN) and does not hold any state money-transmitter license. Any Litecoin buy / sell on-ramps or off-ramps, where offered, are provided by independent third-party partners who may be licensed and who handle any required KYC/AML and licensing themselves. No card-based payment processing is offered or integrated.
          </p>

          <h2 className="text-foreground text-lg font-semibold">3. No deposit insurance.</h2>
          <p>
            Litecoin held in any LTCme.click wallet is not insured by the Federal Deposit Insurance Corporation (FDIC), the Securities Investor Protection Corporation (SIPC), or any other government or private deposit-insurance scheme. Your funds are not a bank deposit and are not backed by any insurance fund. If your keys are lost, stolen, or destroyed, your funds are gone permanently with no recourse.
          </p>

          <h2 className="text-foreground text-lg font-semibold">4. Cryptocurrency risk; no investment advice.</h2>
          <p>
            Litecoin and other cryptocurrencies are highly volatile and speculative. You can lose 100% of the value you send or hold. Nothing in this app, the AI assistant, blog content, or any communication from LTCme.click constitutes investment, legal, tax, accounting, or financial advice, or a recommendation to buy, sell, hold, or transact in Litecoin or any other asset. The LTCme AI assistant may produce general information about the Litecoin protocol and wallets; its output is not advice and may be incorrect, outdated, or incomplete. Always do your own research and consult a licensed professional before making financial decisions. Past performance does not indicate future results.
        
  </p>

          <h2 className="text-foreground text-lg font-semibold">5. Taxes are your responsibility.</h2>
          <p>
            You are solely responsible for determining and fulfilling any tax obligations arising from your use of LTCme.click, including reporting gains, losses, income, and transactions to the IRS and any state or foreign tax authority. Buying, selling, exchanging, sending, or receiving Litecoin may create taxable events under U.S. federal and state law (for example, reporting on Form 8949 and Schedule D, or foreign account reporting such as FBAR/FinCEN Form 114 where applicable). LTCme.click does not provide tax forms, cost-basis tracking, or tax advice, and does not report your transactions to any tax authority. Keep your own records.
          </p>

          <h2 className="text-foreground text-lg font-semibold">6. Self-custody & key security.</h2>
          <p>
            You alone hold and control your private keys, seed phrase, and any optional BIP39 passphrase. We never see, store, transmit, or have the ability to recover them. If you lose your seed phrase, forget your encryption passphrase, or have them stolen — through phishing, malware, clipboard hijacking, screen capture, cloud backup of plaintext, shoulder surfing, a compromised device, or any other means — your funds are gone permanently. Treat your seed phrase like cash: write it on paper or metal, store it offline, never type it into a website, email, chat, photo, or password-manager cloud sync, and never share it with anyone, including people claiming to be LTCme.click support. We will never ask for it.
          </p>

          <h2 className="text-foreground text-lg font-semibold">7. Movement of funds & irreversibility.</h2>
          <p>
            Every Litecoin transaction you broadcast is final once confirmed. There is no chargeback, refund, undo, cancel, or customer-service reversal. Always verify the recipient address character-by-character (malware can swap clipboar
d contents), confirm the amount in both LTC and USD, and start with a small test send for new addresses or large amounts. Sending to the wrong address, the wrong network, or a burned address will result in a permanent loss of funds.
          </p>

          <h2 className="text-foreground text-lg font-semibold">8. Fees.</h2>
          <p>
            A service fee of 0.1% of the send amount is paid to the LTCme.click operator as a separate output on every on-chain send, bundled dynamically with the broadcast transaction (never charged in advance). Litecoin network (miner) fees are paid separately to the Litecoin network and vary with congestion. LTCme.click does not guarantee any fee estimate; estimates are provided by third parties and may be inaccurate. Subscription fees for unlimited AI are listed on the billing page and may change with notice.
          </p>

          <h2 className="text-foreground text-lg font-semibold">9. Third-party services & integrations.</h2>
          <p>
            Price quotes, blockchain data, mempool/fee estimates, buy/sell on-ramps and off-ramps, and any external integrations rely on independent third parties we do not operate or control. Outages, incorrect data, censorship, address poisoning, or malicious responses from those services can affect what you see in this app. Do not treat any displayed balance, fee, or quote as guaranteed. We are not responsible for the acts or omissions of any third-party service.
          </p>

          <h2 className="text-foreground text-lg font-semibold">10. AI assistant.</h2>
          <p>
            The LTCme AI assistant is an automated language model that can make mistakes. It cannot access your keys, see your balances unless you disclose them, or move funds. Never paste your seed phrase, private keys, passwords, or other secrets into the assistant. Do not rely on its output as financial, legal, or security advice. We may limit the number of free messages and offer paid unlimited plans.
    
      </p>

          <h2 className="text-foreground text-lg font-semibold">11. Acceptable use; no prohibited activity.</h2>
          <p>
            You agree not to use LTCme.click for any unlawful purpose, including money laundering, terrorist financing, sanctions evasion, fraud, market manipulation, or activity involving proceeds of crime. You represent that you are not located in, or a resident of, a country or territory subject to comprehensive U.S. sanctions (including Cuba, Iran, North Korea, Syria, and the Crimea, DNR, and LNR regions of Ukraine), and that you are not on any U.S. government restricted-party list (e.g., OFAC SDN list). You must be at least 18 years old (or the age of majority in your jurisdiction). You may not reverse engineer, scrape, overload, attack, or disrupt the service.
          </p>

          <h2 className="text-foreground text-lg font-semibold">12. Compliance & jurisdiction.</h2>
          <p>
            You are responsible for complying with the laws of your country, state, or jurisdiction — including but not limited to anti-money-laundering (AML), countering the financing of terrorism (CFT), sanctions, securities, money-transmission, and tax-reporting rules. LTCme.click is provided "as is" without warranties of any kind. Do not use this app where prohibited by law. These Terms are governed by the laws of the United States and the state in which the operator is established, without regard to conflict-of-laws principles.
          </p>

          <h2 className="text-foreground text-lg font-semibold">13. Subscriptions & payments.</h2>
          <p>
            We do not accept card payments. Pro subscriptions (unlimited AI and advanced tools) are
            activated by an on-chain Litecoin payment only: you send the exact LTC amount for your
            chosen tier to the displayed payment address, paste the transaction ID, and we verify
            the payment on the Litecoin blockchain before activating your subscription. No
            third-party card processor (such as Stripe) is used or integrated. Litecoin payments
            are non-refundable once confirmed on the network — double-check the address and amount
            before sending, as a mistaken send to the wrong address or the wrong network is a
            permanent loss of funds. Subscriptions do not auto-renew: when your access period ends,
            you must send a new LTC payment to extend it. We do not store, hold, or control the
            Litecoin you send; activation is based solely on our verification of a public,
            confirmed on-chain transaction. Network fees paid to miners are separate from the
            subscription price and are not refundable. If a payment is not detected, underpaid, or
            sent from an incompatible network, contact support with your transaction ID.
          </p>

          <h2 className="tex
t-foreground text-lg font-semibold">14. No warranty; limitation of liability.</h2>
          <p>
            LTCme.click is provided "as is" and "as available," without warranties of any kind, including merchantability, fitness for a particular purpose, title, or non-infringement. To the maximum extent permitted by law, the total aggregate liability of LTCme.click and its affiliates for any claim arising from these Terms or your use of the service is limited to the greater of (a) the amounts you paid to LTCme.click in the twelve months preceding the claim, or (b) USD $100. Some jurisdictions do not allow certain limitations, so some of these may not apply to you.
          </p>

          <h2 className="text-foreground text-lg font-semibold">15. Indemnification.</h2>
          <p>
            You agree to indemnify and hold harmless LTCme.click, its operators, owners, employees, and affiliates from any claim, demand, loss, damages, or expense (including reasonable attorneys' fees) arising out of your use of the service, your violation of these Terms, or your violation of any law or the rights of a third party.
          </p>

          <h2 className="text-foreground text-lg font-semibold">16. Dispute resolution.</h2>
          <p>
            Any dispute arising from these Terms or the service shall first be attempted to be resolved informally. If unresolved within 30 days, the dispute shall be resolved by binding arbitration administered in the United States under the Federal Arbitration Act, and you waive any right to participate in a class action or class-wide arbitration. This section does not prevent either party from seeking injunctive relief in a court of competent jurisdiction for intellectual-property or security matters.
          </p>

          <h2 className="text-foreground text-lg font-semibold">17. Changes to these Terms.</h2>
          <p>
            We may update these Terms from time to time. Material changes will be posted on this page with a new
 "Last updated" date; your continued use of LTCme.click after changes take effect constitutes acceptance of the revised Terms.
          </p>

          <p className="pt-6 text-foreground">
            By using LTCme.click you acknowledge that you have read, understood, and accepted these Terms and the risks of self-custody.
          </p>

          <div className="mt-8 neon-rule" />
          <p className="text-xs pt-6">
            Questions? Email <a className="text-primary hover:underline" href="mailto:support@ltcme.click">support@ltcme.click</a>. See also <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link to="/support" className="text-primary hover:underline">Support</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
