import { ethers } from "ethers";
import classNames from "classnames";
// @ts-expect-error no types for jdenticon
import Jdenticon from "react-jdenticon";
import type { SDKState } from "@metamask/sdk-react";
import { memo, useCallback, useState } from "react";
import CodeEditor from "@uiw/react-textarea-code-editor";
import OneInchFusion from "../../assets/EIP712Messages/OneInch-fusion.json";
import { validateTypedMessage } from "../../helpers/inputValidators";
import UniswapX from "../../assets/EIP712Messages/Uniswapx.json";
import Permit2 from "../../assets/EIP712Messages/Permit2.json";
import Permit from "../../assets/EIP712Messages/Permit.json";
import { TypedMessage } from "./types";

const EIP712Signer = ({
  account,
  provider,
  chainId,
}: {
  account: SDKState["account"];
  provider: SDKState["provider"];
  chainId: SDKState["chainId"];
}) => {
  const [typedMessageError, setTypedMessageError] = useState<Error>();
  const [typedMessage, setTypedMessage] = useState<string>(
    JSON.stringify(
      {
        domain: {
          verifyingContract: "0x000000000000000000000000deadbeefdeadbeef",
          chainId,
        },
        primaryType: "Test",
        message: { owner: "0x000000000000000000000000deadbeefdeadbeef" },
        types: {
          EIP712Domain: [
            { name: "chainId", type: "uint256" },
            { name: "verifyingContract", type: "address" },
          ],
          Test: [{ name: "owner", type: "address" }],
        },
      },
      null,
      2,
    ),
  );
  const handleTypedMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const [value, error] = validateTypedMessage(e.target.value);
      setTypedMessage(value);
      setTypedMessageError(error);
    },
    [],
  );

  const onSignTypedMessage = useCallback(() => {
    if (!provider || typedMessageError) return;
    const signer = new ethers.providers.Web3Provider(
      provider as unknown as ethers.providers.ExternalProvider,
    ).getSigner();

    const parsedTypedMessage = JSON.parse(typedMessage) as TypedMessage;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { EIP712Domain, ...types } = parsedTypedMessage.types;
    signer
      ._signTypedData(
        parsedTypedMessage.domain,
        types,
        parsedTypedMessage.message,
      )
      .then((tx) => console.log(tx))
      .catch(console.error);
  }, [provider, typedMessage, typedMessageError]);

  return (
    <div className="card bg-white shadow-xl flex-grow">
      <div className="card-body">
        <h2 className="card-title items-end">
          <span>
            Sign <span className="font-mono">EIP-712</span> with{" "}
          </span>
          <span className="flex flex-row gap-2">
            <Jdenticon size="24" value={account} />
            <span>
              {account?.slice(0, 8)}...{account?.slice(36, 42)}
            </span>
          </span>
        </h2>
        <div className="flex flex-col gap-2">
          <div>Common EIP712:</div>
          <div className="flex flex-wrap gap-2">
            {chainId === "0x1" && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setTypedMessage(JSON.stringify(Permit, null, 2));
                  }}
                >
                  USDC Permit on mainnet
                </button>
                <div
                  className="tooltip hover:cursor-pointer"
                  data-tip="(Not working needs to be fixed)"
                >
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setTypedMessage(JSON.stringify(UniswapX, null, 2));
                    }}
                    disabled={true}
                  >
                    Uniswap X on mainnet
                  </button>
                </div>
              </>
            )}
            {chainId === "0x89" && (
              <>
                <button
                  className="btn btn-accent"
                  onClick={() => {
                    setTypedMessage(JSON.stringify(Permit2, null, 2));
                  }}
                >
                  Permit 2 on Polygon
                </button>
                <button
                  className="btn btn-neutral"
                  onClick={() => {
                    setTypedMessage(JSON.stringify(OneInchFusion, null, 2));
                  }}
                >
                  1Inch Fusion on Polygon
                </button>
              </>
            )}
          </div>
        </div>
        <label className="form-control flex-grow">
          <div className="label">
            <span className="label-text font-semibold">Typed Message</span>
          </div>
          <CodeEditor
            className={classNames([
              "textarea textarea-bordered flex-grow w-full",
              typedMessageError ? "textarea-error" : "",
            ])}
            value={typedMessage}
            language="json"
            onChange={handleTypedMessageChange}
            padding={15}
          />
          <div className="label justify-end">
            {typedMessageError ? (
              <span className="label-text-alt badge badge-error">
                {typedMessageError.message}
              </span>
            ) : null}
          </div>
        </label>
        <button
          className="btn btn-primary btn-outline"
          onClick={onSignTypedMessage}
          disabled={Boolean(typedMessageError)}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default memo(EIP712Signer);
