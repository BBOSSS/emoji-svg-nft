import scaffoldConfig from "~~/scaffold.config";
import { contracts, GenericContract } from "~~/utils/scaffold-eth/contract";

export function getAllContracts() {
  // SvgEmojiNFT
  const contractsData = contracts?.[scaffoldConfig.targetNetworks[0].id];
  if (!contractsData) {
    return {};
  }
  const svgEmojiNFT = contractsData.SvgEmojiNFT;
  if (!svgEmojiNFT) {
    return contractsData;
  }
  // const svgEmojiProxy = contractsData.SvgEmojiProxy;
  // if (svgEmojiProxy) {
  //   svgEmojiNFT.address = svgEmojiProxy.address;
  // }
  return {
    SvgEmojiNFT: svgEmojiNFT
  };
}
