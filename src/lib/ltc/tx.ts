// Build & sign a Litecoin transaction from a decrypted mnemonic (bech32 accounts).
import * as bip39 from "bip39";
import { Buffer } from "buffer";
import { bitcoin, bip32, ECPair } from "./wallet";
import { litecoinMainnet, LTC } from "./network";
import type { Utxo } from "./api";
import { getRawTx, estimateFeeRate, broadcastTx } from "./api";
import coinSelect from "coinselect";

export interface BuildInput {
  mnemonic: string;
  addressType: "bech32" | "legacy" | "p2sh";
  account?: number;
  scanDepth?: number; // how many receive & change addresses to scan for UTXOs
  utxosByAddress: Record<string, Utxo[]>;
  toAddress: string;
  amountSats: number;
  feeRate?: number; // sats/vbyte
  changeAddress: string;
}

export interface BuildResult {
  rawHex: string;
  txid: string;
  feeSats: number;
  vbytes: number;
}

/**
 * Build & sign a P2WPKH (bech32) tx from mnemonic. Only bech32 supported in v1.
 */
export async function buildAndSignTx(input: BuildInput): Promise<BuildResult> {
  if (input.addressType !== "bech32") {
    throw new Error("Only bech32 (ltc1...) sending is supported in v1.");
  }
  const feeRate = input.feeRate ?? (await estimateFeeRate());
  const seed = bip39.mnemonicToSeedSync(input.mnemonic.trim());
  const root = bip32.fromSeed(seed, litecoinMainnet as any);
  const account = input.account ?? 0;
  const scanDepth = input.scanDepth ?? 20;

  // Build a lookup: address -> node
  const branches = [
    root.derivePath(`m/84'/${LTC.bip44CoinType}'/${account}'/0`),
    root.derivePath(`m/84'/${LTC.bip44CoinType}'/${account}'/1`),
  ];
  const addrToNode = new Map<string, any>();
  for (let b = 0; b < 2; b++) {
    for (let i = 0; i < scanDepth; i++) {
      const c = branches[b].derive(i);
      const p = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(c.publicKey),
        network: litecoinMainnet as any,
      });
      if (p.address) addrToNode.set(p.address, c);
    }
  }

  // Flatten UTXOs, tagging with values
  const flatUtxos: (Utxo & { value: number })[] = [];
  for (const [, arr] of Object.entries(input.utxosByAddress)) {
    for (const u of arr) flatUtxos.push(u);
  }

  const targets = [{ address: input.toAddress, value: input.amountSats }];
  const { inputs, outputs, fee } = coinSelect(
    flatUtxos.map((u) => ({ ...u, txId: u.txid })),
    targets,
    feeRate,
  );
  if (!inputs || !outputs) throw new Error("Not enough funds for this amount + fee.");

  const psbt = new bitcoin.Psbt({ network: litecoinMainnet as any });
  for (const inp of inputs) {
    const node = addrToNode.get(inp.address);
    if (!node) throw new Error(`Missing key for UTXO address ${inp.address}`);
    const p2wpkh = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(node.publicKey),
      network: litecoinMainnet as any,
    });
    psbt.addInput({
      hash: inp.txid,
      index: inp.vout,
      witnessUtxo: { script: p2wpkh.output!, value: inp.value },
    });
  }
  for (const out of outputs) {
    psbt.addOutput({
      address: out.address ?? input.changeAddress,
      value: out.value,
    });
  }
  for (let i = 0; i < inputs.length; i++) {
    const node = addrToNode.get(inputs[i].address);
    const kp = ECPair.fromPrivateKey(Buffer.from(node.privateKey!), {
      network: litecoinMainnet as any,
    });
    psbt.signInput(i, {
      publicKey: Buffer.from(kp.publicKey),
      sign: (hash: Buffer) => Buffer.from(kp.sign(hash)),
    });
  }
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();
  return {
    rawHex: tx.toHex(),
    txid: tx.getId(),
    feeSats: fee,
    vbytes: tx.virtualSize(),
  };
}

export { broadcastTx, getRawTx };