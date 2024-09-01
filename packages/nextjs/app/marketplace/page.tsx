"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import {
  useScaffoldContract, 
  useScaffoldReadContract, 
  useScaffoldWriteContract,
  useScaffoldEventHistory,
  useDeployedContractInfo
} from "~~/hooks/scaffold-eth";
import { Price } from "./components/Price"

const Marketplace: NextPage = () => {
  const router = useRouter();
  const [myEmojis, setMyEmojis] = useState<any[]>();
  const [loadingEmojis, setLoadingEmojis] = useState(true);
  const [update, setUpdate] = useState(false);

  const [page, setPage] = useState(1n);
  const perPage = 4n;

  const { writeContractAsync } = useScaffoldWriteContract("SwapNFT");
  const { data: swapNFTContractData } = useDeployedContractInfo("SwapNFT");

  const { data: price } = useScaffoldReadContract({
    contractName: "SvgEmojiNFT",
    functionName: "price",
  });

  const { data: totalSupply } = useScaffoldReadContract({
    contractName: "SvgEmojiNFT",
    functionName: "totalSupply",
  });

  const marketplaceAddress = swapNFTContractData?.address;

  const { data: balance } = useScaffoldReadContract({
    contractName: "SvgEmojiNFT",
    functionName: "balanceOf",
    args: [marketplaceAddress],
  });

  const purchaseNFT = async (tokenId: bigint, price: bigint) => {
    try {
      await writeContractAsync({
        functionName: "purchase",
        args: [tokenId],
        value: price,
      });
      setTimeout(() => {
        router.push("/my-emojis");
      }, 777);
    } catch (err) {
      console.error("Error calling purchase function");
    }
  };

  const [nftMintedEventLength, setNftMintedEventLength] = useState(0);
  const { data: NftMintedEvents, isLoading: isNftMintedEventsLoading } = useScaffoldEventHistory({
    contractName: "SvgEmojiNFT",
    eventName: "NftMinted",
    fromBlock: 6593899n,
    watch: true,
    filters: {
      minter: marketplaceAddress,
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

  const { data: nft } = useScaffoldContract({
    contractName: "SvgEmojiNFT",
  });
  const { data: marketplace } = useScaffoldContract({
    contractName: "SwapNFT",
  });

  useEffect(() => {
    const updateAllEmojis = async () => {
      setLoadingEmojis(true);
      if (nft && balance && marketplaceAddress && marketplace) {
        const collectibleUpdate = [];
        const startIndex = balance - 1n - perPage * (page - 1n);
        for (let tokenIndex = startIndex; tokenIndex > startIndex - perPage && tokenIndex >= 0; tokenIndex--) {
          try {
            const tokenId = await nft.read.tokenOfOwnerByIndex([marketplaceAddress, tokenIndex]);
            const tokenURI = await nft.read.tokenURI([tokenId]);
            const [seller, price] = await marketplace.read.orderMap([tokenId]);
            const jsonManifestString = atob(tokenURI.substring(29));

            try {
              const jsonManifest = JSON.parse(jsonManifestString);
              collectibleUpdate.push({ id: tokenId, uri: tokenURI, seller: seller, price: price, ...jsonManifest });
            } catch (e) {
              console.log(e);
            }
          } catch (e) {
            console.log(e);
          }
        }
        console.log("Collectible Update: ", collectibleUpdate);
        setMyEmojis(collectibleUpdate);
      }
      setLoadingEmojis(false);
    };
    updateAllEmojis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance, page, perPage, marketplaceAddress, Boolean(nft), nftMintedEventLength, update]);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-6">
        {/* <div className="px-5">
          <h1 className="text-center">
            <span className="block text-4xl font-bold">Marketplace Emojis</span>
          </h1>
        </div> */}

        <div className="flex-grow w-full mt-2 p-2">
          <div className="flex justify-center items-center space-x-2">
            {loadingEmojis ? (
              <p className="my-2 font-medium">Loading...</p>
            ) : !myEmojis?.length ? (
              <p className="my-2 font-medium">No emojis on marketplace</p>
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
                        <Price className="text-xl text-blue-500 font-bold" nftPrice={emoji.price}></Price>
                        <Address address={emoji.seller} />
                        <Image src={emoji.image} alt={emoji.name} width="300" height="300" />
                        <p>{emoji.description}</p>
                        <div className="card-actions justify-end">
                          <label
                            className="btn btn-primary btn-sm font-normal gap-1 px-4"
                            onClick={() => purchaseNFT(emoji.id, emoji.price)}>
                            <span>Purchase</span> 
                          </label>
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

export default Marketplace;
