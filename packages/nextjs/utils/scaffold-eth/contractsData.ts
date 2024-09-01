import scaffoldConfig from "~~/scaffold.config";
import { contracts, GenericContract } from "~~/utils/scaffold-eth/contract";

export function getAllContracts() {
  // SvgEmojiNFT
  const contractsData = contracts?.[scaffoldConfig.targetNetworks[0].id];
  if (!contractsData) {
    return {};
  }
  const svgEmojiNFT = contractsData.SvgEmojiNFT;
  const swapNFT = contractsData.SwapNFT;
  return {
    SvgEmojiNFT: svgEmojiNFT,
    SwapNFT: swapNFT,
  };
}
