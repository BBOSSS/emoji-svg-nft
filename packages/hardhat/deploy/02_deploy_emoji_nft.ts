import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";
import { ethers } from "hardhat/";
import { SvgEmojiNFT, VRFCoordinatorV2Mock } from "../typechain-types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import * as fs from "fs";

/**
 * Deploys a contract named "SvgEmojiNFT" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */

const FUND_AMOUNT = "1000000000000000000000";

const deployEmojiNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
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

  const svgEmojiLib = await ethers.getContract("SvgEmoji");
  const svgEmojiAddr = await svgEmojiLib.getAddress();
  console.log("SvgEmoji address is ", svgEmojiAddr);

  // Get mock args
  let vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
  let subscriptionId = networkConfig[chainId].subscriptionId;
  if (developmentChains.includes(hre.network.name)) {
    const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = await vrfCoordinatorV2Mock.getAddress();
    const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
    const transactionReceipt = await transactionResponse.wait();
    subscriptionId = BigInt(transactionReceipt?.logs[0].topics[1] || 0).toString();
    console.log("subscriptionId: ", subscriptionId);
    // Fund the subscription
    // Our mock makes it so we don't actually have to worry about sending fund
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  // Deploy SvgEmojiNFT implementation
  await deploy("SvgEmojiNFT", {
    ...options,
    args: [
      vrfCoordinatorV2Address,
      subscriptionId,
      networkConfig[chainId].callbackGasLimit,
      networkConfig[chainId].gasLane,
    ],
    libraries: {
      SvgEmoji: svgEmojiAddr
    },
  });
  const svgEmojiNFT: SvgEmojiNFT = await ethers.getContract("SvgEmojiNFT");
  const svgEmojiNftAddr = await svgEmojiNFT.getAddress();
  console.log("SvgEmojiNFT address is ", svgEmojiNftAddr);

  // Deploy proxy contract
  const key = `${chainId}_EMOJI_NFT_PROXY_ADDRESS`
  let svgEmojiProxyAddr = process.env[key];
  // upgrade or create
  if (svgEmojiProxyAddr) {
    console.log("Update SvgEmojiProxy implementation: ", svgEmojiNftAddr);
    const svgEmojiProxy = await ethers.getContractAt("SvgEmojiNFT", svgEmojiProxyAddr);
    await svgEmojiProxy.upgradeToAndCall(svgEmojiNftAddr, "0x");
    return;
  }

  const initCallData = svgEmojiNFT.interface.encodeFunctionData("initialize");
  await deploy("SvgEmojiProxy", {
    ...options,
    args: [svgEmojiNftAddr, initCallData]
  });
  const svgEmojiProxy = await ethers.getContract("SvgEmojiProxy");
  svgEmojiProxyAddr = await svgEmojiProxy.getAddress();
  console.log("SvgEmojiProxy address is ", svgEmojiProxyAddr);
  fs.appendFileSync(".env", `\n${key}=${svgEmojiProxyAddr}\n`);
  console.log("Update EMOJI_NFT_PROXY_ADDRESS to .env");
  // Add VRF Consumer: SvgEmojiProxy
  if (developmentChains.includes(hre.network.name)) {
    const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    await vrfCoordinatorV2Mock.addConsumer(BigInt(subscriptionId || 0), svgEmojiProxyAddr);
  }
};

export default deployEmojiNft;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags SvgEmojiNFT
deployEmojiNft.tags = ["all", "nft"];
