// Curated, read-only Litecoin earning opportunities.
//
// IMPORTANT: Litecoin is proof-of-work and has NO native staking. Everything
// listed here is third-party lending, liquidity or wrapped-LTC exposure and
// must never be described as "Litecoin staking".
export type RiskPreference = "lower" | "balanced" | "higher";

export const RISK_PREFERENCES: { id: RiskPreference; label: string; blurb: string }[] = [
  { id: "lower", label: "Lower Risk", blurb: "Custodial or well-established venues, no bridging where possible." },
  { id: "balanced", label: "Balanced", blurb: "A mix of established venues and mainstream wrapped-LTC routes." },
  { id: "higher", label: "Higher Risk", blurb: "Includes bridges, liquidity pools and impermanent-loss exposure." },
];

export const RISK_LABEL_DISCLAIMER =
  "Lower / Balanced / Higher Risk are comparisons between the options shown here — not guarantees. Any option can lose value.";

export const EARN_DISCLAIMER =
  "Litecoin does not have native staking. Earn opportunities may involve lending, liquidity pools, wrapped LTC, or third-party providers. These involve additional risk.";

export type YieldKind = "Lending" | "Liquidity pool" | "Wrapped LTC" | "Savings product";

export interface Opportunity {
  id: string;
  provider: string;
  network: string;
  kind: YieldKind;
  /** Advertised annual yield, percent. Estimates only. */
  apy: number;
  howYieldWorks: string;
  lockup: string;
  withdrawal: string;
  selfCustody: boolean;
  requiresWrapping: boolean;
  kyc: boolean;
  /** One-off costs to enter and exit, percent of principal (estimate). */
  entryCostPct: number;
  exitCostPct: number;
  risks: string[];
  riskTier: RiskPreference;
  url: string;
}

/** Estimated net yield after known one-off costs, over a 12-month horizon. */
export function netYield(o: Opportunity): number {
  return Math.round((o.apy - o.entryCostPct - o.exitCostPct) * 100) / 100;
}

export function filterByRisk(list: Opportunity[], pref: RiskPreference): Opportunity[] {
  const order: RiskPreference[] = ["lower", "balanced", "higher"];
  const max = order.indexOf(pref);
  return list.filter((o) => order.indexOf(o.riskTier) <= max);
}

export const OPPORTUNITIES: Opportunity[] = [
  {
    id: "nexo-ltc",
    provider: "Nexo",
    network: "Custodial (off-chain)",
    kind: "Lending",
    apy: 4,
    howYieldWorks: "Your LTC is lent out by the platform to borrowers; interest is paid from their loan book.",
    lockup: "None (flexible), higher rates require fixed terms",
    withdrawal: "Usually same day, subject to platform limits",
    selfCustody: false,
    requiresWrapping: false,
    kyc: true,
    entryCostPct: 0.05,
    exitCostPct: 0.1,
    risks: ["Custody risk — the provider holds your LTC", "Platform insolvency risk", "Terms and rates can change", "Withdrawals can be paused"],
    riskTier: "lower",
    url: "https://nexo.com",
  },
  {
    id: "youhodler-ltc",
    provider: "YouHodler",
    network: "Custodial (off-chain)",
    kind: "Savings product",
    apy: 5,
    howYieldWorks: "Platform pays interest on deposited LTC funded by its lending and trading activity.",
    lockup: "None advertised",
    withdrawal: "On request, network fee applies",
    selfCustody: false,
    requiresWrapping: false,
    kyc: true,
    entryCostPct: 0.05,
    exitCostPct: 0.15,
    risks: ["Custody risk", "Counterparty and insolvency risk", "Jurisdiction restrictions"],
    riskTier: "balanced",
    url: "https://youhodler.com",
  },
  {
    id: "binance-ltc-flex",
    provider: "Binance Simple Earn",
    network: "Custodial (off-chain)",
    kind: "Lending",
    apy: 1.2,
    howYieldWorks: "Flexible lending product; the exchange lends deposited LTC to margin traders.",
    lockup: "None (flexible)",
    withdrawal: "Typically instant to exchange balance",
    selfCustody: false,
    requiresWrapping: false,
    kyc: true,
    entryCostPct: 0.05,
    exitCostPct: 0.1,
    risks: ["Custody risk", "Rates float daily and can approach zero", "Regional availability limits"],
    riskTier: "lower",
    url: "https://www.binance.com/en/earn",
  },
  {
    id: "aave-wltc",
    provider: "Aave (wrapped LTC route)",
    network: "Ethereum",
    kind: "Wrapped LTC",
    apy: 2.5,
    howYieldWorks: "Native LTC is bridged into a wrapped ERC-20 representation, then supplied to a lending market where borrowers pay interest.",
    lockup: "None, but bridge round-trip takes time",
    withdrawal: "Withdraw, then unwrap and bridge back to native LTC",
    selfCustody: true,
    requiresWrapping: true,
    kyc: false,
    entryCostPct: 0.6,
    exitCostPct: 0.6,
    risks: ["Bridge risk — wrapped LTC depends on the bridge's solvency", "Smart-contract risk", "Ethereum gas fees can exceed the yield on small amounts", "Wrapped LTC is not native LTC"],
    riskTier: "higher",
    url: "https://app.aave.com",
  },
  {
    id: "thorchain-ltc-lp",
    provider: "THORChain LTC pool",
    network: "THORChain",
    kind: "Liquidity pool",
    apy: 7,
    howYieldWorks: "You deposit native LTC into a cross-chain swap pool and earn a share of swap fees and incentives.",
    lockup: "None enforced, but exiting at a bad ratio locks in losses",
    withdrawal: "Anytime, paid out in pool assets",
    selfCustody: true,
    requiresWrapping: false,
    kyc: false,
    entryCostPct: 0.4,
    exitCostPct: 0.4,
    risks: ["Impermanent loss if LTC price moves against the paired asset", "Smart-contract and protocol risk", "Liquidity risk on exit", "Advertised APY is variable and historic"],
    riskTier: "higher",
    url: "https://app.thorswap.finance",
  },
];
