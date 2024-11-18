import { ethers } from "ethers";
import { ERC1155_FUNCTIONS, ERC20_FUNCTIONS, ERC721_FUNCTIONS } from "./const";

export type Chain = {
  name: string;
  icon: string;
  ticker: string;
  explorers: {
    url: string;
    hostedBy: string;
  }[];
};

export type ExplorerTransaction = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  isError: string;
  txreceipt_status: string;
  input?: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  gasUsed: string;
  confirmations: string;
  methodId: string;
  functionName: string;
};

export type FeeData =
  | {
      maxPriorityFeePerGas: ethers.BigNumber;
      maxFeePerGas: ethers.BigNumber;
      gasPrice?: never;
    }
  | {
      gasPrice: ethers.BigNumber;
      maxPriorityFeePerGas?: never;
      maxFeePerGas?: never;
    };

export type FeeHistory = {
  baseFeePerBlobGas: `0x${string}`[];
  baseFeePerGas: `0x${string}`[];
  blobGasUsedRatio: number[];
  gasUsedRatio: number[];
  oldestBlock: string;
  reward: `0x${string}`[][];
};

export type ERC20Function = (typeof ERC20_FUNCTIONS)[number];
export type ERC721Function = (typeof ERC721_FUNCTIONS)[number];
export type ERC1155Function = (typeof ERC1155_FUNCTIONS)[number];
