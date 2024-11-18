import { ethers } from "ethers";
import { useEffect, useState } from "react";
import type { SDKState } from "@metamask/sdk-react";
import { FeeData, FeeHistory } from "../types";

export const useFeeData = (
  externalProvider: SDKState["provider"],
  chainId: SDKState["chainId"],
  refreshInterval = 30_000,
): [FeeData | undefined] => {
  const [feeData, setFeeData] = useState<FeeData>();

  useEffect(() => {
    if (!externalProvider) return;
    const provider = new ethers.providers.Web3Provider(
      externalProvider as unknown as ethers.providers.ExternalProvider,
    );

    const getFeeData = async () => {
      const supportsEIP1559 = await provider
        .getBlock("latest")
        .then((block) => "baseFeePerGas" in block);

      const feeData = await (async () => {
        if (supportsEIP1559) {
          const feeHistory: FeeHistory = await provider.send("eth_feeHistory", [
            "0x5", // Fetching the history for 5 blocks
            "latest", // from the latest block
            [50], // 50% percentile sample
          ]);
          // Taking the average priority fee used in the last 5 blocks
          const maxPriorityFeePerGas: ethers.BigNumber = feeHistory.reward
            .reduce((acc, [curr]) => acc.add(curr), ethers.BigNumber.from(0))
            .div(feeHistory.reward.length);

          const nextBaseFee = ethers.BigNumber.from(
            feeHistory.baseFeePerGas[feeHistory.baseFeePerGas.length - 1],
          );

          return {
            maxPriorityFeePerGas,
            maxFeePerGas: nextBaseFee
              // Adding 27% to the base fee to be able to get included at least in the next 3 blocks
              .mul(127)
              .div(100)
              .add(maxPriorityFeePerGas),
          };
        } else {
          const gasPrice = await provider.getGasPrice();

          return {
            gasPrice,
          };
        }
      })();
      setFeeData(feeData);
    };
    getFeeData();

    const timeout = setTimeout(getFeeData, refreshInterval);
    return () => {
      clearTimeout(timeout);
    };
  }, [externalProvider, chainId, refreshInterval]);

  return [feeData];
};
