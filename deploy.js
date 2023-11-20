const { ethers } = require("hardhat");
const fs = require('fs');

async function main() {
  const [deployer] = await ethers.getSigners();
  const listingFee = ethers.utils.parseEther("0.01");

  console.log("Deploying contracts with the account:", deployer.address);
  // We get the contract to deploy
  const Decentroz = await ethers.getContractFactory("Decentroz");
  const decentroz = await Decentroz.deploy();
  await decentroz.deployed();
  console.log("Decentroz deployed to:", decentroz.address);

  await decentroz.mint(deployer.address, 10000);
  // const ownerBalance = await decentroz.balanceOf(deployer.address);

  // console.log("Balance:", ownerBalance);

  // Deploy NFT contract
  const NFT = await ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(deployer.address);
  await nft.deployed();
  console.log("NFT deployed to:", nft.address);

  // Deploy Marketplace
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(decentroz.address, {
    value: listingFee,
  });
  await marketplace.deployed();
  console.log("Marketplace deployed to:", marketplace.address);

  const contractAddressData = {
    decentrozAddress: decentroz.address,
    nftAddress: nft.address,
    marketplaceAddress: marketplace.address
  };
  
  fs.writeFileSync('./artifacts/contracts/contractAddress.json', JSON.stringify(contractAddressData));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
