"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  useScaffoldContract, 
  useScaffoldReadContract, 
  useScaffoldWriteContract,
  useScaffoldEventHistory
} from "~~/hooks/scaffold-eth";

import { Send } from "./Send";
import { Approve } from "./Approve";
import { Sell } from "./Sell";

// https://react-icons.github.io/react-icons/icons/fa/
import { FaSync } from 'react-icons/fa';


type HoldingProps = {
    onSend?: () => void,
    onSell?: () => void,
    onApprove?: () => void,
}

export const Holding = ({onSend, onSell, onApprove}: HoldingProps) => {
  const { address: connectedAddress } = useAccount();
  const [myEmojis, setMyEmojis] = useState<any[]>();
  const [loadingEmojis, setLoadingEmojis] = useState(true);
  const [update, setUpdate] = useState(false);

  const [page, setPage] = useState(1n);
  const perPage = 4n;

  const { data: price } = useScaffoldReadContract({
    contractName: "SvgEmojiNFT",
    functionName: "price",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "SvgEmojiNFT",
    functionName: "totalSupply",
  });

  const { data: balance } = useScaffoldReadContract({
    contractName: "SvgEmojiNFT",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const [nftMintedEventLength, setNftMintedEventLength] = useState(0);
  const { data: NftMintedEvents, isLoading: isNftMintedEventsLoading } = useScaffoldEventHistory({
    contractName: "SvgEmojiNFT",
    eventName: "NftMinted",
    fromBlock: 6593899n,
    watch: true,
    filters: {
      minter: connectedAddress,
    }
  });

  useEffect(() => {
    if (
      !isNftMintedEventsLoading &&
      Boolean(NftMintedEvents?.length) &&
      (NftMintedEvents?.length as number) > nftMintedEventLength
    ) {
      setNftMintedEventLength(NftMintedEvents?.length as number);
    }
  }, [NftMintedEvents, isNftMintedEventsLoading, nftMintedEventLength]);

  const { writeContractAsync } = useScaffoldWriteContract("SvgEmojiNFT");

  const { data: contract } = useScaffoldContract({
    contractName: "SvgEmojiNFT",
  });
  
  async function getEmojiData(index: bigint) {
    if (!contract || !balance || !connectedAddress) {
      return {};
    }
    try {
      const tokenId = await contract.read.tokenOfOwnerByIndex([connectedAddress, index]);
      const tokenURI = await contract.read.tokenURI([tokenId]);
      const jsonManifestString = atob(tokenURI.substring(29));

      try {
        const jsonManifest = JSON.parse(jsonManifestString);
        return { id: tokenId, uri: tokenURI, ...jsonManifest };
      } catch (e) {
        console.log(e);
      }
    } catch (e) {
      console.log(e);
    }
  }

  useEffect(() => {
    const updateAllEmojis = async () => {
      setLoadingEmojis(true);
      if (contract && balance && connectedAddress) {
        let collectibleUpdate = [];
        const promises = [];
        const startIndex = balance - 1n - perPage * (page - 1n);
        for (let tokenIndex = startIndex; tokenIndex > startIndex - perPage && tokenIndex >= 0; tokenIndex--) {
          const promise = getEmojiData(tokenIndex);
          promises.push(promise);
        }
        try {
          collectibleUpdate = await Promise.all(promises);
        } catch (error) {
            console.error("getEmojiData failed: ", error);
        }
        // console.log("Collectible Update: ", collectibleUpdate);
        setMyEmojis(collectibleUpdate);
      }
      setLoadingEmojis(false);
    };
    updateAllEmojis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, page, perPage, connectedAddress, Boolean(contract), nftMintedEventLength, update]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow">
        <div className="">
          {/* <h1 className="text-center">
            <span className="block text-4xl font-bold">My Emojis</span>
          </h1> */}
          <div className="flex flex-col justify-center items-center space-x-2">
            <button
              onClick={async () => {
                try {
                  await writeContractAsync({
                    functionName: "mintItem",
                    value: price,
                  });
                } catch (e) {
                  console.error(e);
                }
              }}
              className="btn btn-secondary btn-sm"
              disabled={!connectedAddress || !price}
            >
              Mint Now for {price ? (+formatEther(price)).toFixed(6) : "-"} ETH
            </button>
            <p>{Number(3728n - (totalSupply || 0n))} Emojis left</p>
          </div>
        </div>

        <div className="flex-grow w-full mt-2">
          <div className="flex justify-center items-center space-x-2">
            {loadingEmojis ? (
              <p className="my-2 font-medium">Loading...</p>
            ) : !myEmojis?.length ? (
              <div className="flex flex-row">
                <p className="my-2 font-medium me-3">No emojis holding</p>
                <button onClick={() => {
                  setUpdate(!update);
                }}>
                  <FaSync style={{ marginRight: '8px' }} />
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-center">
                  {myEmojis.map(emoji => {
                    return (
                      <div
                        key={emoji.id}
                        className="flex flex-col bg-base-100 p-5 text-center items-center max-w-xs rounded-3xl"
                      >
                        <h2 className="text-xl font-bold">{emoji.name}</h2>
                        <Image src={emoji.image} alt={emoji.name} width="300" height="300" />
                        <p>{emoji.description}</p>
                        <div className="card-actions justify-end">
                          <Send
                            tokenId={emoji.id}
                            onSuccess={() => {
                                setUpdate(!update);
                                onSend && onSend();
                            }}
                          />
                          <Approve 
                            tokenId={emoji.id}
                            onSuccess={() => {
                                onApprove && onApprove();
                            }}
                          />
                          <Sell 
                            tokenId={emoji.id}
                            onSuccess={() => {
                                setUpdate(!update)
                                onSell && onSell();
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center mt-8">
                  <div className="join">
                    {page > 1n && (
                      <button className="join-item btn" onClick={() => setPage(page - 1n)}>
                        «
                      </button>
                    )}
                    <button className="join-item btn btn-disabled">Page {page.toString()}</button>
                    {balance !== undefined && balance > page * perPage && (
                      <button className="join-item btn" onClick={() => setPage(page + 1n)}>
                        »
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
            )}
          </div>
        </div>
      </div>
    </>
  );
};
