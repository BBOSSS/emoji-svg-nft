"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  useScaffoldContract, 
  useScaffoldReadContract, 
  useScaffoldWriteContract,
  useScaffoldEventHistory
} from "~~/hooks/scaffold-eth";

import { Send } from "./components/Send";
import { Approve } from "./components/Approve";
import { Sell } from "./components/Sell";

const MyEmojis: NextPage = () => {
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

  useEffect(() => {
    const updateAllEmojis = async () => {
      setLoadingEmojis(true);
      if (contract && balance && connectedAddress) {
        const collectibleUpdate = [];
        const startIndex = balance - 1n - perPage * (page - 1n);
        for (let tokenIndex = startIndex; tokenIndex > startIndex - perPage && tokenIndex >= 0; tokenIndex--) {
          try {
            const tokenId = await contract.read.tokenOfOwnerByIndex([connectedAddress, tokenIndex]);
            const tokenURI = await contract.read.tokenURI([tokenId]);
            const jsonManifestString = atob(tokenURI.substring(29));

            try {
              const jsonManifest = JSON.parse(jsonManifestString);
              collectibleUpdate.push({ id: tokenId, uri: tokenURI, ...jsonManifest });
            } catch (e) {
              console.log(e);
            }
          } catch (e) {
            console.log(e);
          }
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
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">My Emojis</span>
          </h1>
          <div className="flex flex-col justify-center items-center mt-4 space-x-2">
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

        <div className="flex-grow w-full mt-2 p-8">
          <div className="flex justify-center items-center space-x-2">
            {loadingEmojis ? (
              <p className="my-2 font-medium">Loading...</p>
            ) : !myEmojis?.length ? (
              <p className="my-2 font-medium">No emojis minted</p>
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
                            onSuccess={() => setUpdate(!update)}
                          />
                          <Approve 
                            tokenId={emoji.id}
                          />
                          <Sell 
                            tokenId={emoji.id}
                            onSuccess={() => setUpdate(!update)}
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

export default MyEmojis;
