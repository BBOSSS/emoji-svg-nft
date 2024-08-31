import { ethers } from "hardhat/";
import { VRFCoordinatorV2Interface } from "../typechain-types";

async function main() {
  const coordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
  const vrfCoordinatorV2Interface: VRFCoordinatorV2Interface =
    await ethers.getContractAt("VRFCoordinatorV2Interface", coordinator);

  const transactionResponse = await vrfCoordinatorV2Interface.createSubscription();
  console.log("vrfCoordinatorV2Interface.createSubscription success");

  const transactionReceipt = await transactionResponse.wait();
  const subscriptionId = BigInt(transactionReceipt?.logs[0].topics[1] || 0).toString();
  console.log("subscriptionId: ", subscriptionId);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
