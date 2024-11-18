import { ethers } from "ethers";
import { memo, useMemo } from "react";
import { MINIMAL_L1_GAS_LIMIT } from "../const";
import { Chain } from "../types";

const EsimatedFees = ({
  transaction,
  chain,
}: {
  transaction: ethers.providers.TransactionRequest;
  chain: Chain | undefined;
}) => {
  const estimatedGas = useMemo(
    () =>
      ethers.BigNumber.from(transaction?.gasLimit || MINIMAL_L1_GAS_LIMIT).mul(
        transaction?.gasPrice || transaction?.maxFeePerGas || 0,
      ),
    [transaction?.gasLimit, transaction?.gasPrice, transaction?.maxFeePerGas],
  );

  return (
    <div className="flex flex-row justify-start gap-3">
      <p className="flex flex-grow-0 gap-1">
        <span className="truncate">
          Estimated Price: {ethers.utils.formatEther(estimatedGas)}
        </span>
        <span className="font-mono">{chain?.ticker || "???"}</span>
      </p>
      <kbd
        className="kbd kbd-xs aspect-video tooltip align-middle items-center justify-center hidden md:flex"
        data-tip={`
        ${`Gas Limit: ${transaction.gasLimit}`} |
        ${transaction.gasPrice ? `Gas Price: ${ethers.utils.formatUnits(transaction.gasPrice || 0, "gwei")} gwei |` : ""}
        ${transaction.maxPriorityFeePerGas ? `Max Priority Fee Per Gas: ${ethers.utils.formatUnits(transaction.maxPriorityFeePerGas || 0, "gwei")} gwei |` : ""}
        ${transaction.maxFeePerGas ? `Max Fee Per Gas: ${ethers.utils.formatUnits(transaction.maxFeePerGas || 0, "gwei")} gwei |` : ""}
      `}
      >
        <span>?</span>
      </kbd>
    </div>
  );
};

export default memo(EsimatedFees);
