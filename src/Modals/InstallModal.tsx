import { memo } from "react";

const InstallModal = ({
  onClose,
  link,
}: {
  onClose: () => void;
  link: string;
}) => (
  <div className="modal-box flex flex-col shadow-none text-center">
    <div className="flex flex-col mb-10 items-center">
      <img
        className="w-1/2 mb-2"
        src="https://docs.metamask.io/img/metamask-logo.svg"
        alt="Metamask logo"
      />
      <p className="">Install Metamask first</p>
    </div>
    <div className="flex justify-evenly">
      <a
        className="btn btn-secondary"
        href={link}
        target="_blank"
        rel="noreferrer"
      >
        Install Metamask
      </a>
      <button className="btn btn-error btn-outline" onClick={onClose}>
        Close
      </button>
    </div>
  </div>
);

export default memo(InstallModal);
