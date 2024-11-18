import { ethers } from "ethers";
import { TypedMessage } from "../Components/MessageSigner/types";
import {
  EIP55IncorrectChecksum,
  NotEnoughAssets,
  InvalidAddress,
  NotEnoughFunds,
  UnknownError,
  InvalidTypedMessage,
} from "../const";

export const validateAddress = (input: string): Error | undefined => {
  try {
    ethers.utils.getAddress(input);
    return;
  } catch (e) {
    if (e instanceof Error) {
      if (e.message.startsWith("invalid address")) {
        return InvalidAddress;
      } else if (e.message.startsWith("bad address checksum")) {
        return EIP55IncorrectChecksum;
      }
    }
    return UnknownError;
  }
};

export const validateUint256Balance = (
  input: string,
  esimatedGas: ethers.BigNumber,
  ethBalance: ethers.BigNumber | undefined,
  assetBalance: ethers.BigNumber | undefined,
  decimals?: number | undefined,
): [string, Error | undefined] => {
  const regex = decimals
    ? new RegExp(/0*([0-9]*)(\.|,)*([0-9]*)/)
    : new RegExp(/0*([0-9]*)/);
  const [, sanitizedInt = "0", comma, sanitizedDecimals] =
    regex.exec(input) || [];

  const value = decimals
    ? sanitizedInt || comma
      ? `${sanitizedInt || 0}${comma ? "." + sanitizedDecimals : ""}`
      : "0"
    : sanitizedInt || "0";
  const valueBN = decimals
    ? ethers.utils.parseUnits(
        `${sanitizedInt || 0}.${sanitizedDecimals || 0}`,
        decimals,
      )
    : ethers.BigNumber.from(value);

  const error = ethers.BigNumber.from(ethBalance || 0).lt(esimatedGas)
    ? NotEnoughFunds
    : ethers.BigNumber.from(assetBalance || 0).lt(valueBN)
      ? NotEnoughAssets
      : undefined;

  return [value, error];
};

const isTypedMessage = (message: unknown): message is TypedMessage => {
  return (
    !!message &&
    typeof message === "object" &&
    "domain" in message &&
    "message" in message &&
    "primaryType" in message &&
    "types" in message
  );
};

export const validateTypedMessage = (
  input: string,
): [string, Error | undefined] => {
  try {
    const message = JSON.parse(input);
    const parsedMessage = JSON.stringify(message, null, 2);

    if (!isTypedMessage(message)) {
      return [parsedMessage, InvalidTypedMessage];
    }

    return [parsedMessage, undefined];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return [input, UnknownError];
  }
};
