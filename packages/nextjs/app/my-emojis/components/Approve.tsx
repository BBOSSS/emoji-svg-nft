"use client";

import { useState } from "react";
import { Address as AddressType } from "viem";
import { useAccount } from "wagmi";
import { Address, AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type ApproveNftProps = {
  tokenId: bigint,
  onSuccess?: () => void,
}

export const Approve = ({tokenId, onSuccess}: ApproveNftProps) => {
  const { address: connectedAddress } = useAccount();
  const [loading, setLoading] = useState(false);
  const [inputAddress, setInputAddress] = useState<AddressType>();
  
  const { writeContractAsync } = useScaffoldWriteContract("SvgEmojiNFT");

  const approveNFT = async () => {
    try {
      await writeContractAsync({
        functionName: "approve",
        args: [inputAddress, tokenId],
      });
      setInputAddress("" as AddressType);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Error calling approve function");
    }
  };

  // Render only on local chain
  // if (ConnectedChain?.id !== hardhat.id) {
  //   return null;
  // }

  return (
    <div>
      <label htmlFor="approve-modal" className="btn btn-primary btn-sm font-normal gap-1 px-3">
        <span>Approve</span> 
      </label>
      <input type="checkbox" id="approve-modal" className="modal-toggle" />
      <label htmlFor="approve-modal" className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">{`Approve NFT: Emoji #${tokenId}`}</h3>
          <label htmlFor="approve-modal" className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <div className="space-y-3">
            <div className="flex flex-row">
              <span className="text-sm font-bold me-1">From:</span>
              <Address address={connectedAddress} format="long" />
            </div>
            <div className="flex flex-col space-y-3">
              <AddressInput
                placeholder="Approve To Address"
                value={inputAddress ?? ""}
                onChange={value => setInputAddress(value as AddressType)}
              />
              <button className="h-10 btn btn-primary btn-sm px-2 rounded-full" 
                onClick={approveNFT} 
                disabled={loading}>
                  Approve 
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
