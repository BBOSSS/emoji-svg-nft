import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";
import { ethers } from "hardhat/";
import { SwapNFT } from "../typechain-types";
import * as fs from "fs";

/**
 * Deploys a contract named "SwapNFT" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */

const deploySwapNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const chainId = await hre.getChainId();
  // Default deploy options
  const options: DeployOptions = {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  };

  const svgEmojiProxy = await ethers.getContract("SvgEmojiProxy");
  const svgEmojiProxyAddr = await svgEmojiProxy.getAddress();
  console.log("SvgEmojiProxy address is ", svgEmojiProxyAddr);

  // Deploy SwapNFT implementation
  await deploy("SwapNFT", {
    ...options,
    args: [svgEmojiProxyAddr]
  });
  const swapNFT: SwapNFT = await ethers.getContract("SwapNFT");
  const swapNftAddr = await swapNFT.getAddress();
  console.log("SwapNFT address is ", swapNftAddr);

  // Deploy proxy contract
  const key = `${chainId}_SWAP_NFT_PROXY_ADDRESS`
  let swapNftProxyAddr = process.env[key];
  // upgrade or create
  if (swapNftProxyAddr) {
    console.log("Update SwapNFTProxy implementation: ", swapNftAddr);
    const swapNftProxy = await ethers.getContractAt("SwapNFT", swapNftProxyAddr);
    await swapNftProxy.upgradeToAndCall(swapNftAddr, "0x");
    return;
  }

  const initCallData = swapNFT.interface.encodeFunctionData("initialize");
  await deploy("SwapNFTProxy", {
    ...options,
    args: [swapNftAddr, initCallData]
  });
  const swapNFTProxy = await ethers.getContract("SwapNFTProxy");
  swapNftProxyAddr = await swapNFTProxy.getAddress();
  console.log("SwapNFTProxy address is ", swapNftProxyAddr);

  fs.appendFileSync(".env", `\n${key}=${swapNftProxyAddr}\n`);
  console.log("Update SWAP_NFT_PROXY_ADDRESS to .env");
};

export default deploySwapNft;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags SwapNFT
deploySwapNft.tags = ["all", "swap"];
