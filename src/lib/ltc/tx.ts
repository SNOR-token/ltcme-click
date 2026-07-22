// Build & sign a Litecoin transaction from a decrypted mnemonic (bech32 accounts).
import "@/lib/buffer-polyfill";
import * as scureBip39 from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import * as bitcoin from "bitcoinjs-lib";
import { keyPairFromPrivate, keyPairFromWif, validateMnemonic, type KeyPair, type AddressType } from "./wallet";
import { litecoinMainnet, LTC } from "./network";
import type { Utxo } from "./api";
import { getRawTx, estimateFeeRate, broadcastTx } from "./api";
import coinSelect from "coinselect";
import { Buffer } from "buffer";
import ecc from "@bitcoinerlab/secp256k1";

bitcoin.initEccLib(ecc as unknown as Parameters<typeof bitcoin.initEccLib>[0]);

export interface BuildInput {
  // For HD wallets: BIP39 mnemonic. For single-key wallets: raw WIF string.
  secret: string;
  passphrase?: string;
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

interface AddrEntry {
  kp: KeyPair;
  type: AddressType;
}

function registerKp(map: Map<string, AddrEntry>, kp: KeyPair, type: AddressType) {
  const pk = Buffer.from(kp.publicKey);
  if (type === "bech32") {
    const p = bitcoin.payments.p2wpkh({ pubkey: pk, network: litecoinMainnet as any });
    if (p.address) map.set(p.address, { kp, type });
  } else if (type === "p2sh") {
    const p = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey: pk, network: litecoinMainnet as any }),
      network: litecoinMainnet as any,
    });
    if (p.address) map.set(p.address, { kp, type });
  } else {
    const p = bitcoin.payments.p2pkh({ pubkey: pk, network: litecoinMainnet as any });
    if (p.address) map.set(p.address, { kp, type });
  }
}

/**
 * Build & sign a Litecoin tx. Supports bech32 (BIP84), p2sh-segwit (BIP49),
 * and legacy (BIP44) inputs derived from an HD mnemonic, or a single WIF key
 * (which can spend from any of its three address forms).
 */
export async function buildAndSignTx(input: BuildInput): Promise<BuildResult> {
  const feeRate = input.feeRate ?? (await estimateFeeRate());
  const account = input.account ?? 0;
  const scanDepth = input.scanDepth ?? 20;
  const addrToKp = new Map<string, AddrEntry>();
  const secret = input.secret.trim();

  if (validateMnemonic(secret)) {
    const seed = scureBip39.mnemonicToSeedSync(secret, input.passphrase ?? "");
    const root = HDKey.fromMasterSeed(seed, {
      private: litecoinMainnet.bip32.private,
      public: litecoinMainnet.bip32.public,
    });
    const specs: { purpose: number; type: AddressType }[] = [
      { purpose: 84, type: "bech32" },
      { purpose: 49, type: "p2sh" },
      { purpose: 44, type: "legacy" },
    ];
    for (const { purpose, type } of specs) {
      for (const change of [0, 1]) {
        const branch = root.derive(`m/${purpose}'/${LTC.bip44CoinType}'/${account}'/${change}`);
        for (let i = 0; i < scanDepth; i++) {
          const c = branch.deriveChild(i);
          if (!c.privateKey || !c.publicKey) continue;
          const kp = keyPairFromPrivate(c.privateKey, true);
          registerKp(addrToKp, kp, type);
        }
      }
    }
  } else {
    // Single-key WIF import — register all three address forms.
    const kp = keyPairFromWif(secret);
    registerKp(addrToKp, kp, "bech32");
    registerKp(addrToKp, kp, "p2sh");
    registerKp(addrToKp, kp, "legacy");
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
    const entry = addrToKp.get(inp.address);
    if (!entry) throw new Error(`Missing key for UTXO address ${inp.address}`);
    const pk = Buffer.from(entry.kp.publicKey);
    if (entry.type === "bech32") {
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: pk, network: litecoinMainnet as any });
      psbt.addInput({
        hash: inp.txid,
        index: inp.vout,
        witnessUtxo: { script: p2wpkh.output!, value: inp.value },
      });
    } else if (entry.type === "p2sh") {
      const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: pk, network: litecoinMainnet as any });
      const p2sh = bitcoin.payments.p2sh({ redeem: p2wpkh, network: litecoinMainnet as any });
      psbt.addInput({
        hash: inp.txid,
        index: inp.vout,
        witnessUtxo: { script: p2sh.output!, value: inp.value },
        redeemScript: p2wpkh.output!,
      });
    } else {
      // Legacy p2pkh requires the full previous transaction.
      const rawHex = await getRawTx(inp.txid);
      psbt.addInput({
        hash: inp.txid,
        index: inp.vout,
        nonWitnessUtxo: Buffer.from(rawHex, "hex"),
      });
    }
  }
  for (const out of outputs) {
    psbt.addOutput({
      address: out.address ?? input.changeAddress,
      value: out.value,
    });
  }
  for (let i = 0; i < inputs.length; i++) {
    const entry = addrToKp.get(inputs[i].address)!;
    psbt.signInput(i, {
      publicKey: Buffer.from(entry.kp.publicKey),
      sign: (hash: Buffer) => Buffer.from(entry.kp.sign(hash)),
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