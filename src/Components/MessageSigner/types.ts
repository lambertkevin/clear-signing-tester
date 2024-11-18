export type TypedMessageDomain = Partial<{
  name: string;
  chainId: number;
  version: string;
  verifyingContract: string;
  salt: string;
}>;

export type TypedMessageTypesEntry = {
  name: string;
  type: string;
};

export type TypedMessageTypes = {
  EIP712Domain: TypedMessageTypesEntry[];
  [key: string]: TypedMessageTypesEntry[];
};

export type TypedMessage = {
  domain: TypedMessageDomain;
  types: TypedMessageTypes;
  primaryType: string;
  message: Record<string, unknown>;
};
