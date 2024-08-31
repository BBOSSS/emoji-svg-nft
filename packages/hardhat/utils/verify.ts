import { run } from "hardhat";
import { Address } from "hardhat-deploy/types";

export async function verify(contractAddress: Address, args: any[], contract?: string) {
  console.log("Verify contract...");
  await run("verify:verify", {
    address: contractAddress,
    constructorArguments: args,
    contract: contract,
  }).catch(e => {
    console.error(e);
  });
}
