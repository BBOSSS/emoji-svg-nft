"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import {
  useScaffoldContract,
  useScaffoldReadContract,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";
import { Update } from "./Update";
import { Price } from "../../marketplace/components/Price";
// https://react-icons.github.io/react-icons/icons/fa/
import { FaSync } from 'react-icons/fa';


type SellingProps = {
  onRevoke?: () => void,
  onUpdate?: () => void,
}

export const Selling = ({ onRevoke, onUpdate }: SellingProps) => {
  const { address: connectedAddress } = useAccount();
  const [myEmojis, setMyEmojis] = useState<any[]>();
  const [loadingEmojis, setLoadingEmojis] = useState(true);
  const [update, setUpdate] = useState(false);

  const [page, setPage] = useState(1n);
  const perPage = 4n;

  const { data: balance } = useScaffoldReadContract({
    contractName: "SwapNFT",
    functionName: "balanceOf",
    args: [connectedAddress],
  });

  const { writeContractAsync } = useScaffoldWriteContract("SwapNFT");

  const { data: nft } = useScaffoldContract({
    contractName: "SvgEmojiNFT",
  });
  const { data: marketplace } = useScaffoldContract({
    contractName: "SwapNFT",
  });
  
  async function getEmojiData(index: bigint) {
    if (!nft || !balance || !connectedAddress || !marketplace) {
      return {};
    }
    try {
      const tokenId = await marketplace.read.tokenOfOwnerByIndex([connectedAddress, index]);
      const [seller, price] = await marketplace.read.orderMap([tokenId]);
      const tokenURI = await nft.read.tokenURI([tokenId]);
      const jsonManifestString = atob(tokenURI.substring(29));

      try {
        const jsonManifest = JSON.parse(jsonManifestString);
        return { id: tokenId, uri: tokenURI, seller: seller, price: price, ...jsonManifest };
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
      if (nft && balance && connectedAddress && marketplace) {
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
  }, [balance, page, perPage, connectedAddress, Boolean(nft), update]);

  const revokeOrder = async (tokenId: bigint) => {
    try {
      await writeContractAsync({
        functionName: "revoke",
        args: [tokenId],
      });
    } catch (err) {
      console.error("Error calling revoke function");
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow">
        <div className="flex-grow w-full mt-2">
          <div className="flex justify-center items-center space-x-2">
            {loadingEmojis ? (
              <p className="my-2 font-medium">Loading...</p>
            ) : !myEmojis?.length ? (
              <div className="flex flex-row">
                <p className="my-2 font-medium me-3">No emojis selling</p>
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
                        <Price className="text-xl text-blue-500 font-bold" nftPrice={emoji.price}></Price>
                        {/* <Address address={emoji.seller} /> */}
                        <Image src={emoji.image} alt={emoji.name} width="300" height="300" />
                        <p>{emoji.description}</p>
                        <div className="card-actions justify-end">
                          <Update
                            tokenId={emoji.id}
                            onSuccess={() => {
                              setUpdate(!update);
                              onUpdate && onUpdate();
                            }}
                          />
                          <label
                            className="btn btn-primary btn-sm font-normal gap-1 px-6"
                            onClick={() => {
                              revokeOrder(emoji.id);
                              // setUpdate(!update);
                              onRevoke && onRevoke();
                            }}>
                            <span>Revoke</span>
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
