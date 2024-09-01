"use client";

import { useState } from "react";
import { formatEther } from "viem";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useGlobalState } from "~~/services/store/store";

type PriceProps = {
  nftPrice: bigint,
  className?: string;
  usdMode?: boolean;
};

/**
 * Display (ETH & USD) balance of an ETH address.
 */
export const Price = ({ nftPrice, className = "", usdMode }: PriceProps) => {
  const { targetNetwork } = useTargetNetwork();
  const price = useGlobalState(state => state.nativeCurrencyPrice);

  const [displayUsdMode, setDisplayUsdMode] = useState(price > 0 ? Boolean(usdMode) : false);

  const togglePriceMode = () => {
    if (price > 0) {
      setDisplayUsdMode(prevMode => !prevMode);
    }
  };

  const formattedPrice = nftPrice ? Number(formatEther(nftPrice)) : 0;

  return (
    <button
      className={`btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className}`}
      onClick={togglePriceMode}
    >
      <div className="w-full flex items-center justify-center">
        {displayUsdMode ? (
          <>
            <span className="text-[0.8em] font-bold mr-1">$</span>
            <span>{(formattedPrice * price).toFixed(2)}</span>
          </>
        ) : (
          <>
            <span>{formattedPrice.toFixed(4)}</span>
            <span className="text-[0.8em] font-bold ml-1">{targetNetwork.nativeCurrency.symbol}</span>
          </>
        )}
      </div>
    </button>
  );
};
