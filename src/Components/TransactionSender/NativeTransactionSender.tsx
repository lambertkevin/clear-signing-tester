import { ethers } from "ethers";
import classNames from "classnames";
// @ts-expect-error no types for jdenticon
import Jdenticon from "react-jdenticon";
import type { SDKState } from "@metamask/sdk-react";
import { memo, useCallback, useEffect, useState } from "react";
import { getTransactionEstimatedGas } from "../../helpers/transaction";
import { useFeeData } from "../../Hooks/useFeeData";
import EstimatedFees from "../EstimatedFees";
import {
  validateAddress,
  validateUint256Balance,
} from "../../helpers/inputValidators";
import { Chain } from "../../types";
import {
  EIP55IncorrectChecksum,
  InvalidAddress,
  MINIMAL_L1_GAS_LIMIT,
  NotEnoughAssets,
  NotEnoughFunds,
} from "../../const";

const NativeTransactionSender = ({
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
  const [transaction, setTransaction] =
    useState<ethers.providers.TransactionRequest>({
      to: "0x000000000000000000000000deadbeefdeadbeef",
      value: ethers.BigNumber.from(0),
      data: "0x",
      gasLimit: ethers.BigNumber.from(MINIMAL_L1_GAS_LIMIT),
      chainId: ethers.BigNumber.from(chainId).toNumber(),
    });

  const [value, setValue] = useState("0");
  const [valueError, setValueError] = useState<Error>();
  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const estimatedGas = getTransactionEstimatedGas(transaction);
      const [value, error] = validateUint256Balance(
        e.target.value,
        estimatedGas,
        ethers.BigNumber.from(balance || 0),
        ethers.BigNumber.from(balance || 0),
        18,
      );

      setValue(value);
      setValueError(error);
      setTransaction((prev) => ({
        ...prev,
        value: ethers.utils.parseEther(value),
      }));
    },
    [balance, transaction],
  );

  const [recipientError, setRecipientError] = useState<Error>();
  const handleRecipientChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setRecipientError(validateAddress(e.target.value));
      setTransaction((prev) => ({ ...prev, to: e.target.value }));
    },
    [setTransaction],
  );

  const [dataError, setDataError] = useState<Error>();
  const handleDataChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) {
        setDataError(undefined);
        setTransaction((prev) => ({ ...prev, data: "0x" }));
        return;
      }

      try {
        ethers.utils.hexlify(e.target.value);
        setDataError(undefined);
      } catch (e) {
        if (e instanceof Error) {
          setDataError(e);
        }
      }
      setTransaction((prev) => ({ ...prev, data: e.target.value }));
    },
    [],
  );

  const [feeData] = useFeeData(provider, chainId);
  useEffect(() => {
    if (!feeData) return;
    setTransaction((prev) => ({
      ...prev,
      ...(feeData.gasPrice
        ? { gasPrice: feeData.gasPrice, type: 0 }
        : {
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            type: 2,
          }),
    }));
  }, [feeData]);

  useEffect(() => {
    if (recipientError || valueError || !transaction.to || !transaction.value)
      return;

    const ethersProvider = new ethers.providers.Web3Provider(
      provider as unknown as ethers.providers.ExternalProvider,
    );

    ethersProvider
      .estimateGas({
        from: account,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
      })
      // This would be incorrect for OP Stack chains which need an oracle for L1 fees
      .then((gasLimit) => setTransaction((prev) => ({ ...prev, gasLimit })))
      .catch((e) => {
        console.error(e);
        return MINIMAL_L1_GAS_LIMIT;
      });
  }, [
    account,
    provider,
    recipientError,
    transaction.to,
    transaction.value,
    transaction.data,
    valueError,
  ]);

  const onSignTransaction = useCallback(() => {
    if (!provider) return;
    const signer = new ethers.providers.Web3Provider(
      provider as unknown as ethers.providers.ExternalProvider,
    ).getSigner();

    signer
      .sendTransaction(transaction)
      .then((tx) => console.log(tx))
      .catch(console.error);
  }, [provider, transaction]);

  return (
    <div className="card bg-white shadow-xl">
      <div className="card-body">
        <h2 className="card-title items-end">
          <span>
            Send <span className="font-mono">{chain?.ticker || "???"}</span>{" "}
            with{" "}
          </span>
          <span className="flex flex-row gap-2">
            <Jdenticon size="24" value={account} />
            <span>
              {account?.slice(0, 8)}...{account?.slice(36, 42)}
            </span>
          </span>
        </h2>

        <label className="form-control">
          <div className="label">
            <span className="label-text font-semibold">Recipient</span>
          </div>
          <input
            type="text"
            placeholder="0x..."
            className={classNames([
              "input input-bordered",
              recipientError === InvalidAddress ? "input-error" : undefined,
              recipientError === EIP55IncorrectChecksum
                ? "input-warning"
                : undefined,
            ])}
            value={transaction.to}
            onChange={handleRecipientChange}
          />
          <div className="label justify-end">
            {recipientError === EIP55IncorrectChecksum ? (
              <span className="label-text-alt badge badge-warning">
                EIP-55 Checksum incorrect
              </span>
            ) : null}
          </div>
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text font-semibold">Value</span>
          </div>
          <label
            className={classNames([
              "input input-bordered flex items-center justify-between gap-2",
              valueError ? "input-error" : "",
            ])}
          >
            <input
              type="text"
              className="grow"
              value={value}
              onChange={handleValueChange}
            />
            <span className="badge">{chain?.ticker || "???"}</span>
          </label>
          <div className="label justify-end">
            {valueError === NotEnoughFunds || valueError === NotEnoughAssets ? (
              <span className="label-text-alt badge badge-error">
                Not enough funds
              </span>
            ) : null}
          </div>
        </label>
        <label className="form-control">
          <div className="label">
            <span className="label-text font-semibold">Data</span>
          </div>
          <input
            type="text"
            className={classNames([
              "input input-bordered grow",
              dataError ? "input-error" : undefined,
            ])}
            value={transaction.data?.toString()}
            onChange={handleDataChange}
          />
          <div className="label justify-end">
            {dataError ? (
              <span className="label-text-alt badge badge-error">
                Invalid Calldata
              </span>
            ) : null}
          </div>
        </label>
        <EstimatedFees transaction={transaction} chain={chain} />

        <button
          className="btn btn-primary btn-outline"
          onClick={onSignTransaction}
          disabled={Boolean(!transaction.to || recipientError || valueError)}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default memo(NativeTransactionSender);
