import axios from "axios";
import { ethers } from "ethers";
import classNames from "classnames";
// @ts-expect-error no types for jdenticon
import Jdenticon from "react-jdenticon";
import type { SDKState } from "@metamask/sdk-react";
import { memo, useEffect, useState } from "react";
import { Chain, ExplorerTransaction } from "../types";

const Account = ({
  address,
  provider,
  chainId,
  chain,
  connected,
}: {
  address: SDKState["account"];
  provider: SDKState["provider"];
  chainId: SDKState["chainId"];
  chain: Chain | undefined;
  connected: boolean;
}) => {
  const [balance, setBalance] = useState<ethers.BigNumber>();
  useEffect(() => {
    if (!provider || !address) return;
    const ethersProvider = new ethers.providers.Web3Provider(
      provider as unknown as ethers.providers.ExternalProvider,
    );

    ethersProvider.getBalance(address).then((balance) => setBalance(balance));
  }, [address, provider, chainId]);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<ExplorerTransaction[]>();
  useEffect(() => {
    if (!chain?.explorers.length || !historyOpen || !connected) return;
    axios
      .get<{ message: string; status: string; result: ExplorerTransaction[] }>(
        `${chain?.explorers[0].url}api`,
        {
          params: {
            module: "account",
            action: "txlist",
            address: address,
            startblock: 0,
            sort: "desc",
          },
        },
      )
      .then(({ data }) => setHistory(data.result));
  }, [historyOpen, chain, address, connected]);

  return address ? (
    <div
      className={classNames(
        "card bg-white relative w-full h-full truncate",
        connected ? "shadow-xl" : "opacity-70 shadow-inner",
      )}
    >
      <figure>
        <Jdenticon size="256" value={address} />
      </figure>
      <div className="card-body flex-none max-w-fit">
        <span className="card-title hidden md:inline-flex text-base">
          {address}
        </span>
        <h2 className="card-title md:hidden">
          {" "}
          {address.slice(0, 8)}...{address.slice(36, 42)}
        </h2>
        <div className="flex gap-2 items-baseline">
          <span className="font-semibold">Balance:</span>{" "}
          <span className="flex gap-1">
            <span>{ethers.utils.formatEther(balance || 0)}</span>
            <span className="font-mono">{chain?.ticker || "???"}</span>
          </span>
        </div>
        {connected && (
          <details
            className="collapse outline-neutral-content outline outline-2 collapse-arrow w-full relative"
            onClick={() => setHistoryOpen(!historyOpen)}
          >
            <summary className="collapse-title font-medium">
              See history
            </summary>
            <div className="collapse-content w-full overflow-scroll">
              {!history ? (
                <div className="flex justify-center p-4">
                  <span className="loading loading-ring loading-md"></span>
                </div>
              ) : history?.length === 0 ? (
                <p>No Transactions</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Hash</th>
                      <th>Value</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history?.map((tx, i) => (
                      <tr key={tx.hash}>
                        <th className="flex-shrink">{i + 1}</th>
                        <td className="w-3/12">
                          {tx.hash.slice(0, 8)}...{tx.hash.slice(36, 42)}
                        </td>
                        <td className="w-2/12 whitespace-nowrap">
                          <span className="truncate mr-1">
                            {Number(ethers.utils.formatEther(tx.value))}
                          </span>
                          <span className="font-mono">
                            {chain?.ticker || "???"}
                          </span>
                        </td>
                        <td className="w-4/12">
                          {new Date(
                            Number(tx.timeStamp) * 1000,
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  ) : null;
};

export default memo(Account);
