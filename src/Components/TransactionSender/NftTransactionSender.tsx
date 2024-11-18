import { ethers } from "ethers";
import classNames from "classnames";
// @ts-expect-error no types for jdenticon
import Jdenticon from "react-jdenticon";
import type { SDKState } from "@metamask/sdk-react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { getNftNameAndBalance, getNftType } from "../../helpers/contract";
import { Chain, ERC1155Function, ERC721Function } from "../../types";
import { useFeeData } from "../../Hooks/useFeeData";
import ERC1155ABI from "../../assets/ABI/ERC1155.json";
import ERC721ABI from "../../assets/ABI/ERC721.json";
import EstimatedFees from "../EstimatedFees";
import {
  validateUint256Balance,
  validateAddress,
} from "../../helpers/inputValidators";
import {
  getDefaultNftsValues,
  getTransactionEstimatedGas,
} from "../../helpers/transaction";
import {
  EIP55IncorrectChecksum,
  MINIMAL_L1_GAS_LIMIT,
  ERC1155_FUNCTIONS,
  ERC721_FUNCTIONS,
  InvalidAddress,
  NotEnoughFunds,
  NotEnoughAssets,
} from "../../const";

const NftTransactionSender = ({
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

  const [nftAddress, setNftAddress] = useState<string>();
  const handleNftAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNftAddress(e.target.value);
      setTransaction((prev) => ({ ...prev, to: e.target.value }));
    },
    [],
  );
  const [tokenId, setTokenId] = useState<string>();
  const handleTokenIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTokenId(
        e.target.value
          ? ethers.BigNumber.from(e.target.value).toString()
          : undefined,
      );
    },
    [],
  );

  const [nftType, setNftType] = useState<"ERC721" | "ERC1155">();
  useEffect(() => {
    if (!nftAddress) {
      return;
    }
    getNftType(ethersProvider, nftAddress).then(setNftType);
  }, [account, ethersProvider, nftAddress]);

  const contract = useMemo(() => {
    if (!nftAddress || !nftType) return;

    return new ethers.Contract(
      nftAddress,
      nftType === "ERC721" ? ERC721ABI : ERC1155ABI,
      ethersProvider,
    );
  }, [nftAddress, ethersProvider, nftType]);
  const [nftName, setNftName] = useState<string>("???");
  const [nftBalance, setNftBalance] = useState<ethers.BigNumber>();
  useEffect(() => {
    if (!contract || !tokenId || !account || !nftType) return;
    getNftNameAndBalance(contract, nftType, account, tokenId).then(
      ([name, balance]) => {
        setNftName(name);
        setNftBalance(balance);
      },
    );
  }, [account, contract, nftType, tokenId]);

  const [inputs, setInputs] = useState<
    Record<string, { value: string; error?: Error }>
  >({});
  const [nftFunctionName, setNftFunctionName] = useState<
    ERC721Function | ERC1155Function
  >("safeTransferFrom");
  const nftFunction = useMemo(() => {
    if (!nftType) return;
    return nftType === "ERC721"
      ? ERC721ABI.find((func) => func.name === nftFunctionName)
      : ERC1155ABI.find((func) => func.name === nftFunctionName);
  }, [nftType, nftFunctionName]);
  const handleNftFunctionNameChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setNftFunctionName(e.target.value as ERC721Function | ERC1155Function);
    },
    [],
  );

  const handleInputChange = useCallback(
    (input: { name: string; type: string }) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (input.type === "uint256") {
          const esimatedGas = getTransactionEstimatedGas(transaction);
          const [value, error] = validateUint256Balance(
            e.target.value,
            esimatedGas,
            ethers.BigNumber.from(balance),
            nftBalance,
          );
          return setInputs((prev) => ({
            ...prev,
            [input.name]: error ? { value, error } : { value },
          }));
        } else if (input.type === "address") {
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
    [balance, nftBalance, transaction],
  );

  useEffect(() => {
    const defaultValues = getDefaultNftsValues(
      nftFunction?.inputs,
      account,
      tokenId,
    );
    if (defaultValues) {
      setInputs(defaultValues);
    }
  }, [account, nftFunction, tokenId]);

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
    if (!contract) return;
    const ethersProvider = new ethers.providers.Web3Provider(
      provider as unknown as ethers.providers.ExternalProvider,
    );

    let calldata = "0x";
    try {
      calldata = contract?.interface.encodeFunctionData(
        nftFunctionName,
        nftFunction?.inputs?.map((input) =>
          input.type === "uint256"
            ? ethers.BigNumber.from(inputs[input.name].value)
            : input.type === "uint256[]"
              ? inputs[input.name].value
                  .split(",")
                  .map((v) => ethers.BigNumber.from(v))
              : input.type === "address[]"
                ? inputs[input.name].value.split(",")
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
      .catch((e) => {
        console.log("Gas Estimation Error", { e });
        setTransaction((prev) => ({
          ...prev,
          data: calldata,
          gasLimit: MINIMAL_L1_GAS_LIMIT,
        }));
      });
  }, [
    account,
    contract,
    inputs,
    nftFunction?.inputs,
    nftFunctionName,
    provider,
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
              {["uint256", "uint256[]"].includes(input.type) &&
              error === NotEnoughFunds ? (
                <span className="label-text-alt badge badge-error">
                  Not enough {chain?.ticker || "???"}
                </span>
              ) : null}
              {["uint256", "uint256[]"].includes(input.type) &&
              error === NotEnoughAssets ? (
                <span className="label-text-alt badge badge-error">
                  Not enough NFT(s)
                </span>
              ) : null}
            </div>
          </label>
        );
      }),
    [chain?.ticker, handleInputChange, inputs],
  );

  return (
    <div className="card bg-white w-full shadow-xl">
      <div className="card-body">
        {chainId === "0x1" ? (
          <div className="flex flex-col gap-2">
            <div>Common NFTs:</div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setNftAddress("0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d");
                  setTokenId("1");
                  setTransaction((prev) => ({
                    ...prev,
                    to: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
                  }));
                }}
              >
                Bored Ape
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setNftAddress("0x348FC118bcC65a92dC033A951aF153d14D945312");
                  setTokenId("2");
                  setTransaction((prev) => ({
                    ...prev,
                    to: "0x348FC118bcC65a92dC033A951aF153d14D945312",
                  }));
                }}
              >
                CloneX
              </button>
              <button
                className="btn btn-accent"
                onClick={() => {
                  setNftAddress("0x495f947276749ce646f68ac8c248420045cb7b5e");
                  setTokenId(
                    "77770246133050101334277152821957558007745772239357041338818208158214799753316",
                  );
                  setTransaction((prev) => ({
                    ...prev,
                    to: "0x495f947276749ce646f68ac8c248420045cb7b5e",
                  }));
                }}
              >
                OpenSea StoreFront
              </button>
            </div>
          </div>
        ) : null}
        <label className="form-control w-full">
          <div className="flex flex-col md:flex-row md:gap-3 flex-grow justify-between">
            <span className="flex-grow">
              <div className="label">
                <span className="label-text">NFT Address</span>
              </div>
              <input
                type="text"
                placeholder="0x..."
                className="input input-bordered w-full"
                value={nftAddress}
                onChange={handleNftAddressChange}
              />
            </span>
            <span className="flex-grow">
              <div className="label">
                <span className="label-text">Token ID</span>
              </div>
              <input
                type="text"
                placeholder="1"
                className="input input-bordered w-full"
                value={tokenId}
                onChange={handleTokenIdChange}
              />
            </span>
          </div>
        </label>
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">
              NFT Method{" "}
              {nftType ? (
                <span className="text-xs font-mono">({nftType})</span>
              ) : null}
            </span>
          </div>
          <select
            className="select select-bordered w-full xl:max-w-sm"
            onChange={handleNftFunctionNameChange}
          >
            {nftType === "ERC721"
              ? ERC721_FUNCTIONS.map((func) => (
                  <option
                    className="capitalize"
                    key={func}
                    value={func}
                    selected={nftFunctionName === func}
                  >
                    {func}
                  </option>
                ))
              : null}
            {nftType === "ERC1155"
              ? ERC1155_FUNCTIONS.map((func) => (
                  <option
                    className="capitalize"
                    key={func}
                    value={func}
                    selected={nftFunctionName === func}
                  >
                    {func}
                  </option>
                ))
              : null}
          </select>
        </label>
      </div>

      {contract && tokenId ? (
        <div className="card-body w-full">
          <h2 className="card-title">
            <div className="flex flex-col flex-grow truncate">
              <span>
                {`${nftFunction?.name} of ${nftName} #${
                  tokenId.length > 10
                    ? tokenId.slice(0, 4) + "..." + tokenId.slice(-4)
                    : tokenId
                }`}
              </span>
              <span className="flex flex-row gap-2">
                <span>with</span>
                <Jdenticon size="24" value={account} />
                <span>
                  {account?.slice(0, 8)}...{account?.slice(36, 42)}
                </span>
              </span>
            </div>
          </h2>
          <h3>
            Balances:
            <ul>
              <li>{nftBalance?.toString()} NFT(s)</li>
              <li>
                {ethers.utils.formatEther(balance || 0)}{" "}
                {chain?.ticker || "???"}
              </li>
            </ul>
          </h3>

          {getControlledInputs(nftFunction?.inputs)}
          <EstimatedFees transaction={transaction} chain={chain} />

          <button
            className="btn btn-primary btn-outline"
            onClick={onSignTransaction}
          >
            Send
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default memo(NftTransactionSender);
