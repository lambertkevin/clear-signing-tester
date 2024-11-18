import axios from "axios";
import { ethers } from "ethers";
import { ERC1155_INTERFACE_ID, ERC721_INTERFACE_ID } from "../const";
import ERC165ABI from "../assets/ABI/ERC165.json";

export const getNftType = (
  provider: ethers.providers.Provider,
  nftAddress: string,
): Promise<"ERC721" | "ERC1155" | undefined> => {
  const contractERC165 = new ethers.Contract(nftAddress, ERC165ABI, provider);
  return Promise.all([
    contractERC165.supportsInterface(ERC721_INTERFACE_ID),
    contractERC165.supportsInterface(ERC1155_INTERFACE_ID),
  ]).then(([isERC721, isERC1155]) => {
    if (isERC721) {
      return "ERC721";
    } else if (isERC1155) {
      return "ERC1155";
    }
  });
};

export const getNftNameAndBalance = (
  contract: ethers.Contract,
  nftType: "ERC721" | "ERC1155",
  account: string,
  tokenId: string,
): Promise<[string, ethers.BigNumber]> => {
  if (nftType === "ERC1155") {
    return Promise.all([
      contract.uri(tokenId).then((uri: string) =>
        axios
          .get(
            uri
              // supports fkin open sea
              .replace(/(0x)?\{id\}/g, tokenId.toString())
              // supports ipfs via gateway
              .replace("ipfs://", "https://ipfs.io/ipfs/"),
          )
          .then(({ data }) => data.name),
      ),
      contract.balanceOf(account, tokenId),
    ]);
  }

  return Promise.all([
    contract.name(),
    contract
      .ownerOf(tokenId)
      .then((isOwner: string) =>
        ethers.BigNumber.from(
          isOwner.toLowerCase() === account?.toLowerCase() ? 1 : 0,
        ),
      ),
  ]);
};
