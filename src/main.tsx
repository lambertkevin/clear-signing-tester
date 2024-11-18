import { MetaMaskProvider } from "@metamask/sdk-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import InstallModal from "./Modals/InstallModal.tsx";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MetaMaskProvider
      debug={true}
      sdkOptions={{
        modals: {
          install: ({ link }) => {
            const modalContainer = document.getElementsByTagName("dialog")[0];
            const modalRoot = createRoot(modalContainer);

            return {
              mount: () => {
                modalRoot.render(
                  <InstallModal
                    link={link}
                    onClose={() => {
                      modalContainer.close();
                    }}
                  />,
                );
                modalContainer.showModal();
              },
              unmount: () => {
                if (modalRoot) {
                  modalRoot.unmount();
                }
              },
            };
          },
        },
        dappMetadata: {
          name: "Clear Signing Tester",
          url: window.location.href,
        },
      }}
    >
      <App />
      <dialog id="modal-container" className="modal"></dialog>
    </MetaMaskProvider>
  </StrictMode>,
);
