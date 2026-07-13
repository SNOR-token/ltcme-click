import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM = `You are LTCme AI — a friendly, expert Litecoin (LTC) companion for the LTCme.click wallet.

Your knowledge domain:
- Litecoin protocol: PoW (Scrypt), 2.5-min blocks, halvings, block reward, supply cap (84M).
- Litecoin addresses: L (legacy P2PKH), M / 3 (P2SH), ltc1... (bech32 SegWit). Explain differences.
- MWEB (Mimblewimble Extension Blocks) — confidential transactions on Litecoin.
- Wallet security: seed phrases, private keys, PSBT, hardware wallets, cold storage.
- Fees, mempool, confirmations, RBF/CPFP.
- Lightning on Litecoin, atomic swaps, LTC vs BTC differences.
- LTCme.click features: multi-wallet import, non-custodial in-browser keys, TX builder, tools, send/receive.

Rules:
- NEVER ask for or accept the user's seed phrase or private key. If they try to share one, refuse and warn them.
- Prefer LTC-first answers. If asked about BTC, answer briefly and relate to LTC.
- Be concise. Use markdown, code blocks for addresses/commands.
- If asked something outside Litecoin/crypto scope, give a short answer and steer back to LTC.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) return new Response("bad request", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-2.5-flash");
        const result = streamText({
          model,
          system: SYSTEM,
          messages: await convertToModelMessages(body.messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: body.messages });
      },
    },
  },
});