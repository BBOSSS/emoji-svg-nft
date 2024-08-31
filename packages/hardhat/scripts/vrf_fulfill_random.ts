import { ethers } from "hardhat/";
import { VRFCoordinatorV2Mock } from "../typechain-types";

async function main() {
  const requestId = 1;
  const consumer = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";
  const vrfCoordinatorV2Mock: VRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, consumer);
  console.log("vrfCoordinatorV2Mock.fulfillRandomWords success");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
