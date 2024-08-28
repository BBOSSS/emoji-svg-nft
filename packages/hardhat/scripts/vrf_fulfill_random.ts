import { ethers } from "hardhat/";
import { VRFCoordinatorV2Mock } from "../typechain-types";

async function main() {
  const requestId = 5;
  const consumer = "0x1eB5C49630E08e95Ba7f139BcF4B9BA171C9a8C7";
  const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, consumer);
  console.log("vrfCoordinatorV2Mock.fulfillRandomWords success");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
