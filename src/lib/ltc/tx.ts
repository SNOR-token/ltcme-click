// Build & sign a Litecoin transaction from a decrypted mnemonic (bech32 accounts).
import * as scureBip39 from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import { bitcoin, keyPairFromPrivate, type KeyPair } from "./wallet";
import { litecoinMainnet, LTC } from "./network";
import type { Utxo } from "./api";
import { getRawTx, estimateFeeRate, broadcastTx } from "./api";
import coinSelect from "coinselect";
import { Buffer } from "buffer";

export interface BuildInput {
  mnemonic: string;
  addressType: "bech32" | "legacy" | "p2sh";
  account?: number;
  scanDepth?: number; // how many receive & change addresses to scan for UTXOs
  utxosByAddress: Record<string, Utxo[]>;
  toAddress: string;
  amountSats: number;
  extraOutputs?: { address: string; value: number }[];
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
  const seed = scureBip39.mnemonicToSeedSync(input.mnemonic.trim());
  const root = HDKey.fromMasterSeed(seed, {
    private: litecoinMainnet.bip32.private,
    public: litecoinMainnet.bip32.public,
  });
  const account = input.account ?? 0;
  const scanDepth = input.scanDepth ?? 20;

  // Build a lookup: address -> KeyPair
  const branches = [
    root.derive(`m/84'/${LTC.bip44CoinType}'/${account}'/0`),
    root.derive(`m/84'/${LTC.bip44CoinType}'/${account}'/1`),
  ];
  const addrToKp = new Map<string, KeyPair>();
  for (let b = 0; b < 2; b++) {
    for (let i = 0; i < scanDepth; i++) {
      const c = branches[b].deriveChild(i);
      if (!c.privateKey || !c.publicKey) continue;
      const kp = keyPairFromPrivate(c.privateKey, true);
      const p = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(kp.publicKey),
        network: litecoinMainnet as any,
      });
      if (p.address) addrToKp.set(p.address, kp);
    }
  }

  // Flatten UTXOs, tagging with values
  const flatUtxos: (Utxo & { value: number })[] = [];
  for (const [, arr] of Object.entries(input.utxosByAddress)) {
    for (const u of arr) flatUtxos.push(u);
  }

  const targets = [{ address: input.toAddress, value: input.amountSats }];
  for (const eo of input.extraOutputs ?? []) {
    targets.push({ address: eo.address, value: eo.value });
  }
  const { inputs, outputs, fee } = coinSelect(
    flatUtxos.map((u) => ({ ...u, txId: u.txid })),
    targets,
    feeRate,
  );
  if (!inputs || !outputs) throw new Error("Not enough funds for this amount + fee.");

  const psbt = new bitcoin.Psbt({ network: litecoinMainnet as any });
  for (const inp of inputs) {
    const kp = addrToKp.get(inp.address);
    if (!kp) throw new Error(`Missing key for UTXO address ${inp.address}`);
    const p2wpkh = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(kp.publicKey),
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
    const kp = addrToKp.get(inputs[i].address)!;
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