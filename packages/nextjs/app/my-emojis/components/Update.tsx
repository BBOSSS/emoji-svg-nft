"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address, EtherInput } from "~~/components/scaffold-eth";
import { 
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";

type UpdateOrderProps = {
  tokenId: bigint,
  onSuccess?: () => void,
}

export const Update = ({ tokenId, onSuccess }: UpdateOrderProps) => {
  const { address: connectedAddress } = useAccount();
  const [loading, setLoading] = useState(false);
  const [inputPrice, setInputPrice] = useState("");

  const { writeContractAsync } = useScaffoldWriteContract("SwapNFT");

  const updateOrder = async () => {
    try {
      await writeContractAsync({
        functionName: "update",
        args: [tokenId, parseEther(inputPrice as `${number}`)],
      });
      setInputPrice("");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error calling update function");
    }
  };

  return (
    <div>
      <label htmlFor={`update-modal-${tokenId}`} className="btn btn-primary btn-sm font-normal gap-1 px-6">
        <span>Update</span>
      </label>
      <input type="checkbox" id={`update-modal-${tokenId}`} className="modal-toggle" />
      <label htmlFor={`update-modal-${tokenId}`} className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">{`Update Order: Emoji #${tokenId}`}</h3>
          <label htmlFor={`update-modal-${tokenId}`} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <div className="space-y-3">
            <div className="flex flex-row">
              <span className="text-sm font-bold me-1">From:</span>
              <Address address={connectedAddress} format="long" />
            </div>
            <div className="flex flex-col space-y-3">
              <EtherInput
                placeholder="Update Price (Ether/Dollar)"
                value={inputPrice}
                onChange={value => setInputPrice(value)}
              />
              <button className="h-10 btn btn-primary btn-sm px-2 rounded-full"
                onClick={updateOrder}
                disabled={loading}>
                Update Order
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
