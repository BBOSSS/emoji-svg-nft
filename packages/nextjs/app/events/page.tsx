"use client";

import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";


const Events: NextPage = () => {
  const { data: NftRequestedEvents, isLoading: iNftRequestedEventsLoading } = useScaffoldEventHistory({
    contractName: "SvgEmojiNFT",
    eventName: "NftRequested",
    fromBlock: 0n,
  });

  const { data: NftMintedEvents, isLoading: isNftMintedEventsLoading } = useScaffoldEventHistory({
    contractName: "SvgEmojiNFT",
    eventName: "NftMinted",
    fromBlock: 0n,
  });

  return (
    <div className="flex gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      <div className="flex items-center flex-col flex-grow w-full">
        {iNftRequestedEventsLoading ? (
          <div className="flex justify-center items-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="mt-8 w-4/5">
            <div className="text-center mb-4">
              <span className="block text-2xl font-bold">NftRequested Events</span>
            </div>
            <div className="overflow-x-auto shadow-lg">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th className="bg-primary">Minter</th>
                    <th className="bg-primary">Request Id</th>
                  </tr>
                </thead>
                <tbody>
                  {!NftRequestedEvents || NftRequestedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center">
                        No events found
                      </td>
                    </tr>
                  ) : (
                    NftRequestedEvents?.map((event, index) => {
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Address address={event.args.minter} />
                          </td>
                          <td>{event.args.requestId? event.args.requestId.toString() : "NaN"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex items-center flex-col flex-grow w-full">
        {isNftMintedEventsLoading ? (
          <div className="flex justify-center items-center mt-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="mt-8 w-4/5">
            <div className="text-center mb-4">
              <span className="block text-2xl font-bold">NftMinted Events</span>
            </div>
            <div className="overflow-x-auto shadow-lg">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="bg-primary">Minter</th>
                    <th className="bg-primary">Token Id</th>
                    <th className="bg-primary">Request Id</th>
                  </tr>
                </thead>
                <tbody>
                  {!NftMintedEvents || NftMintedEvents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center">
                        No events found
                      </td>
                    </tr>
                  ) : (
                    NftMintedEvents?.map((event, index) => {
                      return (
                        <tr key={index}>
                          <td className="text-center">
                            <Address address={event.args.minter} />
                          </td>
                          <td>{event.args.tokenId? event.args.tokenId.toString() : "NaN"}</td>
                          <td>{event.args.requestId? event.args.requestId.toString() : "NaN"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
