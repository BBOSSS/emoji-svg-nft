import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat/";
import { developmentChains } from "../helper-hardhat-config";

const BASE_FEE = "250000000000000000" // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

const mockContract: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  if (!developmentChains.includes(hre.network.name)) {
    return;
  }
  console.log("Local network detected! Deploying mocks...");
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;
  await deploy("VRFCoordinatorV2Mock", {
    from: deployer,
    args: [BASE_FEE, GAS_PRICE_LINK],
    log: true,
    autoMine: true,
  });
  const vrfV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
  const vrfV2MockAddr = await vrfV2Mock.getAddress();
  console.log("VRFCoordinatorV2Mock deployed: ", vrfV2MockAddr);
};

export default mockContract;

mockContract.tags = ["all", "mock"];
