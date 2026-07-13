// Litecoin mainnet network parameters for bitcoinjs-lib.
// Reference: https://github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp
export const litecoinMainnet = {
  messagePrefix: "\x19Litecoin Signed Message:\n",
  bech32: "ltc",
  bip32: {
    public: 0x0488b21e, // xpub (also supports Ltub, but xpub is standard for BIP44)
    private: 0x0488ade4, // xprv
  },
  pubKeyHash: 0x30, // L addresses (legacy)
  scriptHash: 0x32, // M addresses (P2SH, post-2017)
  wif: 0xb0,
};

export const LTC = {
  name: "Litecoin",
  ticker: "LTC",
  decimals: 8,
  bip44CoinType: 2, // m/44'/2'/0' or m/84'/2'/0' for bech32
};

export function fromSatoshis(sats: number | bigint): number {
  return Number(sats) / 1e8;
}

export function toSatoshis(ltc: number): number {
  return Math.round(ltc * 1e8);
}

export function formatLtc(sats: number | bigint, digits = 8): string {
  const n = fromSatoshis(sats);
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
}