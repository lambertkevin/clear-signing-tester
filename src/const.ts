export const LINEA_SEPOLIA_CHAIN_ID = "0xe705";

export const MINIMAL_L1_GAS_LIMIT = 21_0000;

export const EIP55IncorrectChecksum = new Error("EIP55IncorrectChecksum");
export const InvalidAddress = new Error("InvalidAddress");
export const UnknownError = new Error("UnknownError");
export const NotEnoughFunds = new Error("NotEnoughFunds");
export const NotEnoughAssets = new Error("NotEnoughAssets");
export const InvalidTypedMessage = new Error("InvalidTypedMessage");

export const ERC721_INTERFACE_ID = "0x80ac58cd";
export const ERC1155_INTERFACE_ID = "0xd9b67a26";

export const ERC20_FUNCTIONS = ["transfer", "approve"] as const;
export const ERC721_FUNCTIONS = [
  "safeTransferFrom",
  "transferFrom",
  "setApprovalForAll",
  "approve",
] as const;
export const ERC1155_FUNCTIONS = [
  "safeTransferFrom",
  "setApprovalForAll",
  "safeBatchTransferFrom",
] as const;
