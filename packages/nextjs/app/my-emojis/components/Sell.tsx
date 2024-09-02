"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address, EtherInput } from "~~/components/scaffold-eth";
import { 
  useScaffoldWriteContract, 
  useScaffoldReadContract,
  useDeployedContractInfo
} from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type SellNftProps = {
  tokenId: bigint,
  onSuccess?: () => void,
}

/**
 * Sell modal which lets you sell ETH to any address.
 */
export const Sell = ({ tokenId, onSuccess }: SellNftProps) => {
  const { address: connectedAddress } = useAccount();
  const [loading, setLoading] = useState(false);
  const [inputPrice, setInputPrice] = useState("");


  const { data: approvedAddress } = useScaffoldReadContract({
    contractName: "SvgEmojiNFT",
    functionName: "getApproved",
    args: [tokenId],
  });

  const { writeContractAsync } = useScaffoldWriteContract("SwapNFT");
  const { data: swapNFTContractData } = useDeployedContractInfo("SwapNFT");

  const sellNFT = async () => {
    if (approvedAddress != swapNFTContractData?.address) {
      notification.error(
        <>
          <p className="font-bold mt-0 mb-1">
            {`Emoji #${tokenId} not approve to the Contract`}
          </p>
          <div className="flex flex-row">
            <span className="text-sm font-bold me-1">NFT-Swap Address:</span>
            <Address address={swapNFTContractData?.address} />
          </div>
        </>
      );
      return;
    }
    try {
      await writeContractAsync({
        functionName: "list",
        args: [tokenId, parseEther(inputPrice as `${number}`)],
      });
      setInputPrice("");
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error calling list function");
    }
  };

  return (
    <div>
      <label htmlFor={`sell-modal-${tokenId}`} className="btn btn-primary btn-sm font-normal gap-1 px-7">
        <span>Sell</span>
      </label>
      <input type="checkbox" id={`sell-modal-${tokenId}`} className="modal-toggle" />
      <label htmlFor={`sell-modal-${tokenId}`} className="modal cursor-pointer">
        <label className="modal-box relative">
          {/* dummy input to capture event onclick on modal box */}
          <input className="h-0 w-0 absolute top-0 left-0" />
          <h3 className="text-xl font-bold mb-3">{`Sell NFT: Emoji #${tokenId}`}</h3>
          <label htmlFor={`sell-modal-${tokenId}`} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">
            ✕
          </label>
          <div className="space-y-3">
            <div className="flex flex-row">
              <span className="text-sm font-bold me-1">From:</span>
              <Address address={connectedAddress} format="long" />
            </div>
            <div className="flex flex-col space-y-3">
              <EtherInput
                placeholder="Sell Price (Ether/Dollar)"
                value={inputPrice}
                onChange={value => setInputPrice(value)}
              />
              <button className="h-10 btn btn-primary btn-sm px-2 rounded-full"
                onClick={sellNFT}
                disabled={loading}>
                Make Sell Order
              </button>
            </div>
          </div>
        </label>
      </label>
    </div>
  );
};
