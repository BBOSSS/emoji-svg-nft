export type BaseConfig = {
    name: string;
    gasLane: string;
    callbackGasLimit: string;
    subscriptionId?: string;
    vrfCoordinatorV2?: string;
  };
  
  export type ChainConfig = {
    [chainId: string]: BaseConfig;
  };

const networkConfig: ChainConfig = {
    31337: {
        name: "localhost",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // 30 gwei
        callbackGasLimit: "500000", // 500,000 gas
    } as BaseConfig,
    // Price Feed Address, values can be obtained at https://docs.chain.link/data-feeds/price-feeds/addresses
    11155111: {
        name: "sepolia",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000", // 500,000 gas
        subscriptionId: "12097", // add your ID here!
    } as BaseConfig,
}

const developmentChains = ["hardhat", "localhost"];

export {
    networkConfig,
    developmentChains,
}