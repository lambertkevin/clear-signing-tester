import { memo, useState } from "react";
import type { SDKState } from "@metamask/sdk-react";
import EIP712Signer from "./EIP712Signer";

const MESSAGE_MODES = ["EIP712"] as const;
type MessageModes = (typeof MESSAGE_MODES)[number];

const TransactionSender = ({
  account,
  provider,
  chainId,
}: {
  account: SDKState["account"];
  provider: SDKState["provider"];
  chainId: SDKState["chainId"];
}) => {
  const [messageMode, setMessageMode] = useState<MessageModes>("EIP712");

  return (
    <div className="flex flex-col">
      <label className="form-control w-full mb-4">
        <div className="label">
          <span className="label-text">Message mode</span>
        </div>
        <select
          className="select select-bordered"
          onChange={(e) => setMessageMode(e.target.value as MessageModes)}
        >
          {MESSAGE_MODES.map((mode) => (
            <option className="capitalize" key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
      {messageMode === "EIP712" ? (
        <EIP712Signer account={account} provider={provider} chainId={chainId} />
      ) : null}
    </div>
  );
};

export default memo(TransactionSender);
