import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";
import { ethers } from "hardhat/";

/**
 * Deploys a contract named "SvgEmojiNFT" using the deployer account and
 * constructor arguments set to the deployer address
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployLibraries: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

  const options: DeployOptions = {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  }

  await deploy("SvgHead", options);
  const svgHeadLib = await ethers.getContract("SvgHead");
  const svgHeadAddr = await svgHeadLib.getAddress();
  console.log("SvgHead address is ", svgHeadAddr);

  await deploy("SvgEyes", options);
  const svgEyesLib = await ethers.getContract("SvgEyes");
  const svgEyesAddr = await svgEyesLib.getAddress();
  console.log("SvgEyes address is ", svgEyesAddr);

  await deploy("SvgMouth", options);
  const svgMouthLib = await ethers.getContract("SvgMouth");
  const svgMouthAddr = await svgMouthLib.getAddress();
  console.log("SvgMouth address is ", svgMouthAddr);

  await deploy("SvgEmoji", {
    ...options,
    libraries: {
      SvgHead: svgHeadAddr,
      SvgEyes: svgEyesAddr,
      SvgMouth: svgMouthAddr
    },
  });
  const svgEmojiLib = await ethers.getContract("SvgEmoji");
  const svgEmojiAddr = await svgEmojiLib.getAddress();
  console.log("SvgEmoji address is ", svgEmojiAddr);
};

export default deployLibraries;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags SvgEmojiNFT
deployLibraries.tags = ["all", "lib"];
