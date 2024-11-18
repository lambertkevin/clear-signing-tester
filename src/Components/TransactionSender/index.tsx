import { memo, useState } from "react";
import type { SDKState } from "@metamask/sdk-react";
import NativeTransactionSender from "./NativeTransactionSender";
import ERC20TransactionSender from "./ERC20TransactionSender";
import NftTransactionSender from "./NftTransactionSender";
import { Chain } from "../../types";

const TRANSACTION_MODES = ["Native", "ERC20", "NFT"] as const;
type TransactionModes = (typeof TRANSACTION_MODES)[number];

const TransactionSender = ({
  account,
  provider,
  chainId,
  chain,
  balance,
}: {
  account: SDKState["account"];
  provider: SDKState["provider"];
  chainId: SDKState["chainId"];
  balance: SDKState["balance"];
  chain: Chain | undefined;
}) => {
  const [transactionMode, setTransactionMode] =
    useState<TransactionModes>("Native");

  return (
    <div className="flex flex-col">
      <label className="form-control w-full mb-4">
        <div className="label">
          <span className="label-text">Transaction mode</span>
        </div>
        <select
          className="select select-bordered"
          onChange={(e) =>
            setTransactionMode(e.target.value as TransactionModes)
          }
        >
          {TRANSACTION_MODES.map((mode) => (
            <option className="capitalize" key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
      {transactionMode === "Native" ? (
        <NativeTransactionSender
          account={account}
          provider={provider}
          chainId={chainId}
          chain={chain}
          balance={balance}
        />
      ) : null}
      {transactionMode === "ERC20" ? (
        <ERC20TransactionSender
          account={account}
          provider={provider}
          chainId={chainId}
          chain={chain}
          balance={balance}
        />
      ) : null}
      {transactionMode === "NFT" ? (
        <NftTransactionSender
          account={account}
          provider={provider}
          chainId={chainId}
          chain={chain}
          balance={balance}
        />
      ) : null}
    </div>
  );
};

export default memo(TransactionSender);
