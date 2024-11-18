import { ethers } from "ethers";
import { MINIMAL_L1_GAS_LIMIT } from "../const";

export const getTransactionEstimatedGas = (
  transaction: ethers.providers.TransactionRequest,
): ethers.BigNumber =>
  ethers.BigNumber.from(transaction.gasLimit || MINIMAL_L1_GAS_LIMIT).mul(
    transaction.gasPrice || transaction.maxFeePerGas || 0,
  );

export const getDefaultTokenValues = (
  tokenInputs: { name: string; type: string }[] | undefined,
  account: string | undefined,
): Record<string, { value: string; error?: Error }> | undefined => {
  return tokenInputs?.reduce(
    (acc, curr) => {
      let value: string = "";
      switch (curr.name) {
        case "from":
        case "owner":
          value = account || "";
          break;
        case "to":
        case "spender":
          value = "0x000000000000000000000000deadbeefdeadbeef";
          break;
        default:
          value = "0";
          break;
      }

      return {
        ...acc,
        [curr.name]: { value },
      };
    },
    {} as Record<string, { value: string; error?: Error }>,
  );
};

export const getDefaultNftsValues = (
  nftInputs: { name: string; type: string }[] | undefined,
  account: string | undefined,
  tokenId: string | undefined,
): Record<string, { value: string; error?: Error }> | undefined => {
  return nftInputs?.reduce(
    (acc, curr) => {
      let value: string = "";
      switch (curr.name) {
        case "from":
        case "owner":
          value = account || "";
          break;
        case "to":
        case "spender":
        case "operator":
          value = "0x000000000000000000000000deadbeefdeadbeef";
          break;
        case "tokenId":
        case "id":
          value = tokenId || "0";
          break;
        case "ids":
          value = `${tokenId},${tokenId}`;
          break;
        case "amount":
          value = "1";
          break;
        case "amounts":
          value = "1,1";
          break;
        case "data":
          value = "0x";
          break;
        default:
          value = "0";
          break;
      }

      return {
        ...acc,
        [curr.name]: { value },
      };
    },
    {} as Record<string, { value: string; error?: Error }>,
  );
};
