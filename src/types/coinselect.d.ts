declare module "coinselect" {
  interface CoinSelectInput {
    txid: string;
    txId?: string;
    vout: number;
    value: number;
    address: string;
    script?: string;
  }
  interface CoinSelectTarget {
    address?: string;
    value: number;
    script?: unknown;
  }
  interface CoinSelectResult {
    inputs?: CoinSelectInput[];
    outputs?: CoinSelectTarget[];
    fee: number;
  }
  function coinSelect(
    utxos: CoinSelectInput[],
    targets: CoinSelectTarget[],
    feeRate: number,
  ): CoinSelectResult;
  export default coinSelect;
}