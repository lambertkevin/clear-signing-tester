import axios from "axios";
import { ethers } from "ethers";
import classNames from "classnames";
import { useSDK } from "@metamask/sdk-react";
import { useCallback, useEffect, useState } from "react";
import TransactionSender from "./Components/TransactionSender";
import MessageSigner from "./Components/MessageSigner";
import { LINEA_SEPOLIA_CHAIN_ID } from "./const";
import Account from "./Components/Account";
import Connect from "./Components/Connect";
import { Chain } from "./types";

const App = () => {
  const [addresses, setAddresses] = useState<string[]>();
  const { sdk, connected, provider, chainId, balance, account } = useSDK();

  // getting the chain basic informations & explorers from a small vercel I made
  const [chain, setChain] = useState<Chain>();
  useEffect(() => {
    if (!chainId) return;
    axios
      .get(
        "https://chainlist-nine.vercel.app/" +
          ethers.BigNumber.from(chainId).toString(),
      )
      .then(({ data }) => setChain(data));
  }, [chainId]);

  const switchChain = useCallback(
    async (chainId = LINEA_SEPOLIA_CHAIN_ID) => {
      if (!provider) return;

      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId }],
      });
    },
    [provider],
  );

  return (
    <div
      id="App"
      className="flex flex-col flex-grow items-center justify-center gap-4 p-2 m-auto w-full lg:max-w-5xl"
    >
      <Connect
        sdk={sdk}
        connected={connected}
        addresses={addresses}
        setAddresses={setAddresses}
      />
      {connected && addresses && provider && chainId && (
        <>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            {chain && (
              <div className="flex btn glass btn-active hover:btn-active gap-2 items-center">
                <img
                  className="square w-6 object-contain"
                  src={
                    chain?.icon?.startsWith("http")
                      ? chain.icon
                      : "/testnet.png"
                  }
                />
                <p>Connected to {chain?.name}</p>
              </div>
            )}
            {chainId !== LINEA_SEPOLIA_CHAIN_ID && (
              <button
                className="btn btn-primary btn-outline"
                onClick={() => switchChain()}
              >
                Switch to Linea Sepolia
                <i>
                  <img
                    src="https://icons.llamao.fi/icons/chains/rsz_linea.jpg"
                    className="w-3"
                  />
                </i>
              </button>
            )}
          </div>
          <div className="flex flew-row flex-wrap justify-center gap-4 w-full">
            {addresses.map((address, i) => (
              <div
                className={classNames([
                  i === addresses.length - 1
                    ? "flex-0"
                    : "flex-1 max-w-[fit-content]",
                ])}
                key={address}
              >
                <Account
                  address={address}
                  provider={provider}
                  chainId={chainId}
                  chain={chain}
                  connected={
                    account ? address === account : address === addresses[0]
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-6 lg:flex-row w-full justify-center">
            <div className="flex-1">
              <TransactionSender
                account={account || addresses[0]}
                provider={provider}
                chainId={chainId}
                chain={chain}
                balance={balance}
              />
            </div>
            <div className="flex-1">
              <MessageSigner
                account={account || addresses[0]}
                provider={provider}
                chainId={chainId}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;
