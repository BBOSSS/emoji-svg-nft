import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat/";
import { SvgHead, SvgEyes, SvgMouth, SvgEmoji, SvgEmojiNFT, SvgEmojiProxy } from "../typechain-types";
import { verify } from "../utils/verify";
import { developmentChains, networkConfig } from "../helper-hardhat-config";

const verifyContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (developmentChains.includes(hre.network.name) || !process.env.ETHERSCAN_API_KEY) {
    return;
  }
  // const { deployer } = await hre.getNamedAccounts();
  const chainId = await hre.getChainId();

  const svgHeadLib: SvgHead = await ethers.getContract("SvgHead");
  const svgHeadLibAddr = await svgHeadLib.getAddress();
  await verify(svgHeadLibAddr, []);

  const svgEyesLib: SvgEyes = await ethers.getContract("SvgEyes");
  const svgEyesLibAddr = await svgEyesLib.getAddress();
  await verify(svgEyesLibAddr, []);

  const svgMouthLib: SvgMouth = await ethers.getContract("SvgMouth");
  const svgMouthLibAddr = await svgMouthLib.getAddress();
  await verify(svgMouthLibAddr, []);

  const svgEmojiLib: SvgEmoji = await ethers.getContract("SvgEmoji");
  const svgEmojiLibAddr = await svgEmojiLib.getAddress();
  await verify(svgEmojiLibAddr, []);

  const svgEmojiNFT: SvgEmojiNFT = await ethers.getContract("SvgEmojiNFT");
  const svgEmojiNftAddr = await svgEmojiNFT.getAddress();
  await verify(svgEmojiNftAddr, [
    networkConfig[chainId].vrfCoordinatorV2,
    networkConfig[chainId].subscriptionId,
    networkConfig[chainId].callbackGasLimit,
    networkConfig[chainId].gasLane,
  ]);
  
  const initCallData = svgEmojiNFT.interface.encodeFunctionData("initialize");
  const svgEmojiProxy: SvgEmojiProxy = await ethers.getContract("SvgEmojiProxy");
  const svgEmojiProxybAddr = await svgEmojiProxy.getAddress();
  await verify(svgEmojiProxybAddr, [svgEmojiNftAddr, initCallData], "contracts/SvgEmojiProxy.sol:SvgEmojiProxy");
};

export default verifyContract;

verifyContract.tags = ["verify"];
