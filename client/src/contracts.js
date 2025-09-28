import pokiMarketplaceABI from "./consts/marketplaceABI.json";
import pokiNFTABI from "./consts/nftabi.json";
import pokiTokenABI from "./consts/tokenabi.json";

export const CONTRACTS = {
  pokiMarketplace: {
    address: "0x123...MarketplaceAddress",
    abi: pokiMarketplaceABI,
  },
  pokiNFT: {
    address: "0x456...NFTAddress",
    abi: pokiNFTABI,
  },
  pokiToken: {
    address: "0x789...TokenAddress",
    abi: pokiTokenABI,
  }
};
