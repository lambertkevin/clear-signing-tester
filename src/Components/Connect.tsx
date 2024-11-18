import { memo, useCallback } from "react";
import type { SDKState } from "@metamask/sdk-react";

const Connect = ({
  sdk,
  connected,
  addresses,
  setAddresses,
}: {
  sdk: SDKState["sdk"];
  connected: SDKState["connected"];
  addresses: string[] | undefined;
  setAddresses: React.Dispatch<React.SetStateAction<string[] | undefined>>;
}) => {
  const onConnect = useCallback(async () => {
    try {
      const accounts = await sdk?.connect();
      setAddresses(accounts);
    } catch (err) {
      console.warn("failed to connect..", err);
    }
  }, [sdk, setAddresses]);

  return (
    (!connected || !addresses) && (
      <div className="flex w-1/2 lg:w-1/4 justify-center items-center flex-col gap-y-2">
        <button
          style={{ padding: 10, margin: 10 }}
          onClick={onConnect}
          className="btn btn-secondary btn-outline w-full"
        >
          <i>
            <img
              src="https://metamask.io/images/metamask-logo.png"
              className="w-6"
            />
          </i>
          Connect
        </button>
      </div>
    )
  );
};

export default memo(Connect);
