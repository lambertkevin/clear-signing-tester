import { ethers } from "ethers";
import classNames from "classnames";
// @ts-expect-error no types for jdenticon
import Jdenticon from "react-jdenticon";
import type { SDKState } from "@metamask/sdk-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useFeeData } from "../../Hooks/useFeeData";
import { Chain, ERC20Function } from "../../types";
import ERC20ABI from "../../assets/ABI/ERC20.json";
import EstimatedFees from "../EstimatedFees";
import {
  validateAddress,
  validateUint256Balance,
} from "../../helpers/inputValidators";
import {
  getDefaultTokenValues,
  getTransactionEstimatedGas,
} from "../../helpers/transaction";
import {
  EIP55IncorrectChecksum,
  MINIMAL_L1_GAS_LIMIT,
  ERC20_FUNCTIONS,
  NotEnoughAssets,
  NotEnoughFunds,
  InvalidAddress,
} from "../../const";

const ERC20TransactionSender = ({
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
  const ethersProvider = useMemo(
    () =>
      new ethers.providers.Web3Provider(
        provider as unknown as ethers.providers.ExternalProvider,
      ),
    [provider],
  );
  const [transaction, setTransaction] =
    useState<ethers.providers.TransactionRequest>({
      to: "",
      value: ethers.BigNumber.from(0),
      data: "0x",
      gasLimit: ethers.BigNumber.from(MINIMAL_L1_GAS_LIMIT),
      chainId: ethers.BigNumber.from(chainId).toNumber(),
    });

  const [inputs, setInputs] = useState<
    Record<string, { value: string; error?: Error }>
  >({});
  const [tokenFunctionName, setTokenFunctionName] =
    useState<ERC20Function>("transfer");
  const tokenFunction = useMemo(
    () => ERC20ABI.find(({ name }) => name === tokenFunctionName),
    [tokenFunctionName],
  );
  const handleTokenFunctionNameChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setTokenFunctionName(e.target.value as ERC20Function);
    },
    [],
  );

  useEffect(() => {
    const defaultValues = getDefaultTokenValues(tokenFunction?.inputs, account);
    if (defaultValues) {
      setInputs(defaultValues);
    }
  }, [account, tokenFunction]);

  const [tokenAddress, setTokenAddress] = useState<string>();
  const contract = useMemo(() => {
    if (!tokenAddress) return;
    return new ethers.Contract(tokenAddress, ERC20ABI, ethersProvider);
  }, [tokenAddress, ethersProvider]);
  const handleTokenAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTokenAddress(e.target.value);
      setTransaction((prev) => ({ ...prev, to: e.target.value }));
    },
    [],
  );

  const [tokenBalance, setTokenBalance] = useState("0");
  const [ticker, setTicker] = useState<string>("???");
  const [decimals, setDecimals] = useState<number>(18);
  useEffect(() => {
    if (!contract) {
      setTicker("???");
      return;
    }
    contract.symbol().then(setTicker);
    contract.balanceOf(account).then(setTokenBalance);
    contract.decimals().then(setDecimals);
  }, [contract, account]);

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

  const handleInputChange = useCallback(
    (input: { name: string; type: string }) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (input.type === "uint256") {
          const esimatedGas = getTransactionEstimatedGas(transaction);
          const [value, error] = validateUint256Balance(
            e.target.value,
            esimatedGas,
            ethers.BigNumber.from(balance),
            ethers.BigNumber.from(tokenBalance),
            decimals,
          );

          return setInputs((prev) => ({
            ...prev,
            [input.name]: error ? { value, error } : { value },
          }));
        } else if (input.type === "address") {
          // Empty address shouldn't trigger an error
          if (!e.target.value) {
            return setInputs((prev) => ({
              ...prev,
              [input.name]: { value: e.target.value },
            }));
          }

          const addressError = validateAddress(e.target.value);
          return setInputs((prev) => ({
            ...prev,
            [input.name]: { value: e.target.value, error: addressError },
          }));
        }

        return setInputs((prev) => ({
          ...prev,
          [input.name]: { value: e.target.value },
        }));
      },
    [transaction, balance, tokenBalance, decimals],
  );

  useEffect(() => {
    if (!contract) return;
    const ethersProvider = new ethers.providers.Web3Provider(
      provider as unknown as ethers.providers.ExternalProvider,
    );

    let calldata = "0x";
    try {
      calldata = contract?.interface.encodeFunctionData(
        tokenFunctionName,
        tokenFunction?.inputs?.map((input) =>
          input.type === "uint256"
            ? ethers.utils.parseUnits(inputs[input.name].value, decimals)
            : inputs[input.name].value,
        ),
      );
    } catch (err) {
      console.error(err);
      calldata = "0x";
    }

    ethersProvider
      .estimateGas({
        from: account,
        to: transaction.to,
        value: transaction.value,
        data: calldata,
      })
      // This would be incorrect for OP Stack chains which need an oracle for L1 fees
      .then((gasLimit) => {
        setTransaction((prev) => ({
          ...prev,
          data: calldata,
          gasLimit,
        }));
      })
      .catch((err) => {
        console.log("Gas Estimation Error", { err });
        setTransaction((prev) => ({
          ...prev,
          data: calldata,
          gasLimit: MINIMAL_L1_GAS_LIMIT,
        }));
      });
  }, [
    account,
    contract,
    decimals,
    tokenFunction?.inputs,
    tokenFunctionName,
    inputs,
    provider,
    tokenAddress,
    transaction.to,
    transaction.value,
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

  const getControlledInputs = useCallback(
    (
      functionInputs?: {
        name: string;
        type: string;
      }[],
    ) =>
      functionInputs?.map((input) => {
        const { error, value } =
          inputs[input.name as keyof typeof inputs] || {};
        if (!value) return null;

        return (
          <label className="form-control w-full" key={input.name}>
            <div className="label">
              <span className="label-text font-semibold capitalize">
                {input.name}
              </span>
            </div>
            <input
              type="text"
              placeholder={input.name}
              value={value}
              onChange={handleInputChange(input)}
              className={classNames([
                "input input-bordered",
                input.type === "address" && error === InvalidAddress
                  ? "input-error"
                  : undefined,
                input.type === "address" && error === EIP55IncorrectChecksum
                  ? "input-warning"
                  : undefined,
                input.type === "uint256" && error ? "input-error" : undefined,
              ])}
            />
            <div className="label justify-end">
              {input.type === "address" && error === EIP55IncorrectChecksum ? (
                <span className="label-text-alt badge badge-warning">
                  EIP-55 Checksum incorrect
                </span>
              ) : null}
              {input.type === "uint256" && error === NotEnoughFunds ? (
                <span className="label-text-alt badge badge-error">
                  Not enough {chain?.ticker || "???"}
                </span>
              ) : null}
              {input.type === "uint256" && error === NotEnoughAssets ? (
                <span className="label-text-alt badge badge-error">
                  Not enough {ticker}
                </span>
              ) : null}
            </div>
          </label>
        );
      }),
    [chain?.ticker, handleInputChange, inputs, ticker],
  );

  return (
    <div className="card bg-white w-full shadow-xl">
      <div className="card-body">
        {chainId === "0x1" ? (
          <div className="flex flex-col gap-2 mb-4">
            <div>Common Tokens:</div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setTokenAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
                  setTransaction((prev) => ({
                    ...prev,
                    to: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
                  }));
                }}
              >
                USDC
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setTokenAddress("0xdac17f958d2ee523a2206206994597c13d831ec7");
                  setTransaction((prev) => ({
                    ...prev,
                    to: "0xdac17f958d2ee523a2206206994597c13d831ec7",
                  }));
                }}
              >
                USDT
              </button>
              <button
                className="btn btn-accent"
                onClick={() => {
                  setTokenAddress("0xae7ab96520de3a18e5e111b5eaab095312d7fe84");
                  setTransaction((prev) => ({
                    ...prev,
                    to: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
                  }));
                }}
              >
                STETH
              </button>
            </div>
          </div>
        ) : null}
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">ERC20 Token Address</span>
          </div>
          <input
            type="text"
            placeholder="0x..."
            className="input input-bordered w-full max-w-xs"
            value={tokenAddress}
            onChange={handleTokenAddressChange}
          />
        </label>
        <label className="form-control w-full max-w-xs">
          <div className="label">
            <span className="label-text">ERC20 Method</span>
          </div>
          <select
            className="select select-bordered"
            onChange={handleTokenFunctionNameChange}
          >
            {ERC20_FUNCTIONS.map((func) => (
              <option className="capitalize" key={func} value={func}>
                {func}
              </option>
            ))}
          </select>
        </label>
      </div>
      {contract ? (
        <div className="card-body">
          <h2 className="card-title items-end">
            <span>
              <span className="capitalize">{tokenFunction?.name}</span>{" "}
              <span className="font-mono">{ticker}</span> with{" "}
            </span>
            <span className="flex flex-row gap-2">
              <Jdenticon size="24" value={account} />
              <span>
                {account?.slice(0, 8)}...{account?.slice(36, 42)}
              </span>
            </span>
          </h2>
          <h3 className="italic">
            Balances:
            <ul>
              <li>
                {ethers.utils.formatUnits(tokenBalance, decimals)} {ticker}
              </li>
              <li>
                {ethers.utils.formatEther(balance || 0)}{" "}
                {chain?.ticker || "???"}
              </li>
            </ul>
          </h3>

          {getControlledInputs(tokenFunction?.inputs)}
          <EstimatedFees transaction={transaction} chain={chain} />

          <button
            className="btn btn-primary btn-outline"
            onClick={onSignTransaction}
            disabled={transaction.data === "0x"}
          >
            Send
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default memo(ERC20TransactionSender);
