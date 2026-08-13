// Deterministic agentic safety enforcement.
//
// These checks run in code on the server before any model call. They do NOT
// depend on the model following its system prompt.
export const AGENT_CAPABILITIES = [
  "Read public wallet information you have approved",
  "Explain wallet activity and transactions",
  "Analyze address exposure",
  "Recommend UTXOs to consolidate or avoid",
  "Draft an unsigned transaction proposal for your review",
  "Estimate network fees",
  "Prepare a step-by-step protection plan",
];

export const AGENT_PROHIBITIONS = [
  "Read or request a recovery phrase",
  "Read or request a private key",
  "Receive a wallet password",
  "Sign a transaction",
  "Broadcast anything without your explicit confirmation",
  "Change a destination address",
  "Promise guaranteed quantum protection",
  "Automatically move funds",
  "Make financial decisions for you",
];

const XPRV = /\b(xprv|tprv|Ltpv|ttpv|yprv|zprv|vprv|uprv)[1-9A-HJ-NP-Za-km-z]{50,}\b/;
const WIF = /\b[5KLTc9][1-9A-HJ-NP-Za-km-z]{50,51}\b/;
const HEX_KEY = /\b(?:0x)?[0-9a-fA-F]{64}\b/;

/** Heuristic BIP39-style mnemonic detector: 11+ lowercase words in a row. */
const MNEMONIC = /\b(?:[a-z]{3,8}\s+){10,}[a-z]{3,8}\b/;

export function containsSecretMaterial(text: string): boolean {
  return XPRV.test(text) || WIF.test(text) || MNEMONIC.test(text) || HEX_KEY.test(text);
}

export const SECRET_REFUSAL =
  "I stopped before reading that. It looks like it may contain a recovery phrase, private key or wallet password — I never accept those, and no part of LTCme.click should ever ask you for them. If you pasted a real secret, treat that wallet as compromised and move the funds to a freshly generated wallet.";

export const AGENT_SAFETY_PROMPT = `HARD SAFETY RULES (also enforced in code, outside your control):
- You may: ${AGENT_CAPABILITIES.join("; ")}.
- You must never: ${AGENT_PROHIBITIONS.join("; ")}.
- You have no signing or broadcasting capability. Any transaction you describe is an UNSIGNED PROPOSAL the user must review, sign locally and confirm.
- Never claim Litecoin mainnet transactions are post-quantum protected. They are not.
- Only public addresses, script hashes, transaction ids and user-chosen labels may be discussed. If a user pastes a secret, refuse and tell them to rotate the wallet.`;
