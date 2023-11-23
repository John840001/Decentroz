const { ethers } = require("hardhat");
import DecentrozContract from "../../../artifacts/contracts/Decentroz.sol/Decentroz.json";
import NFTContract from "../../../artifacts/contracts/NFT.sol/NFT.json";
import MarketplaceContract from "../../../artifacts/contracts/Marketplace.sol/Marketplace.json";
import ContractAddresses from "../../../artifacts/contracts/contractAddress.json";

const fetchToken = async (account) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider();
    const decentrozContractAddress = ContractAddresses.decentrozAddress;
    const decentrozContractABI = DecentrozContract.abi;
    const nftContractAddress = ContractAddresses.nftAddress;
    const nftContractABI = NFTContract.abi;
    const marketplaceContractAddress = ContractAddresses.marketplaceAddress;
    const marketplaceContractABI = MarketplaceContract.abi;

    const decentrozContract = new ethers.Contract(
      decentrozContractAddress,
      decentrozContractABI,
      provider
    );

    const nftContract = new ethers.Contract(
      nftContractAddress,
      nftContractABI,
      provider
    );

    const marketplaceContract = new ethers.Contract(
      marketplaceContractAddress,
      marketplaceContractABI,
      provider
    );

    const blockchainData = await decentrozContract.balanceOf(account);
    // console.log("blockchainData: ", blockchainData);
    return blockchainData;
  } catch (error) {
    console.error("Error fetching blockchain data:", error.message);
    throw new Error("Error fetching blockchain data");
  }
};

module.exports = { fetchToken };
