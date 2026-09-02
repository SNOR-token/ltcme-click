import { Shield, AlertTriangle, Lock, Eye, Layers } from "lucide-react";

/**
 * Honest quantum-readiness education. Does NOT claim Litecoin signatures are PQ-secure.
 */
export function QuantumReadiness() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-sm font-medium">Litecoin signatures are not post-quantum</div>
          <p className="text-xs text-muted-foreground mt-1">
            Current Litecoin mainnet transactions use ECDSA (and related elliptic-curve schemes).
            Large-scale quantum computers could eventually threaten those algorithms. LTCme does{" "}
            <strong className="text-foreground">not</strong> claim quantum-proof Litecoin spends.
            This section is education and readiness tooling only.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {[
          {
            icon: Eye,
            title: "Public-key exposure",
            body: "Reusing addresses and publishing signatures exposes public keys. Prefer fresh receive addresses and avoid unnecessary key reuse.",
          },
          {
            icon: Layers,
            title: "Multisig defense-in-depth",
            body: "M-of-N policies reduce single-key compromise risk today. They are not a quantum signature scheme, but they raise the bar for attackers.",
          },
          {
            icon: Lock,
            title: "Encrypted vault",
            body: "Keys at rest in LTCme are encrypted with your vault password. Device compromise and phishing remain primary risks — not only cryptography.",
          },
          {
            icon: Shield,
            title: "Cryptographic agility",
            body: "When Litecoin consensus adopts post-quantum schemes, migration will require new address types and careful coordination. We track that readiness, not market it as already solved.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-xl border border-border bg-card/40 p-3.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <c.icon className="h-4 w-4 text-primary" />
              {c.title}
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{c.body}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Experimental post-quantum libraries may appear in this product for research demos only.
        They are not consensus-valid Litecoin signature schemes and must not be used as a substitute
        for mainnet-compatible signing.
      </p>
    </div>
  );
}
