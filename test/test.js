const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("1. Decentroz Contract Tests", function () {
  let Decentroz;
  let decentroz;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    Decentroz = await ethers.getContractFactory("Decentroz");
    decentroz = await Decentroz.deploy();
    await decentroz.deployed();
  });

  it("Test 1: Should have the correct name and symbol", async function () {
    expect(await decentroz.name()).to.equal("Decentroz");
    expect(await decentroz.symbol()).to.equal("DCZ");
  });

  it("Test 2: Should assign the initial supply to the owner", async function () {
    const ownerBalance = await decentroz.balanceOf(owner.address);
    expect(await decentroz.totalSupply()).to.equal(ownerBalance);
  });

  it("Test 3: Should allow only the admin to mint tokens", async function () {
    const mintAmount = 100;
    await expect(
      decentroz.connect(addr1).mint(addr1.address, mintAmount)
    ).to.be.revertedWith("Not authorized");

    await decentroz.mint(addr1.address, mintAmount);
    const addr1Balance = await decentroz.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(mintAmount);
  });

  it("Test 4: Should allow only the admin to transfer tokens", async function () {
    const transferAmount = 50;
    await expect(
      decentroz.mint(addr1.address, transferAmount),
      await expect(
        decentroz.transferFrom(addr1.address, owner.address, transferAmount)
      ).to.be.revertedWith("ERC20: insufficient allowance")
    );

    await decentroz.mint(owner.address, transferAmount);
    await decentroz.connect(owner).transfer(addr1.address, transferAmount);
    const addr1Balance = await decentroz.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(2 * transferAmount);
  });
});

describe("2. NFT Contract Tests", function () {
  let NFT;
  let nft;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the NFT contract
    NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy(owner.address);
    await nft.deployed();
  });

  it("Task 1: Should deploy the contract and set the correct name and symbol", async function () {
    expect(await nft.name()).to.equal("DecentrozNFT");
    expect(await nft.symbol()).to.equal("DNFT");
  });

  it("Task 2: Should set the marketplace address to the one provided during deployment", async function () {
    expect(await nft.getMarketplaceAddress()).to.equal(owner.address);
  });

  it("Task 3: Should mint a token and update the owner's balance", async function () {
    const tokenURI = "https://example.com/token/1";

    // Mint token and get the tokenId
    const tx = await nft.connect(addr1).mintToken(tokenURI);
    const receipt = await tx.wait();
    const tokenId = receipt.events[0].args.tokenId;

    expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
    expect(await nft.balanceOf(addr1.address)).to.equal(1);
  });

  it("Task 4: Should set the correct token URI", async function () {
    const tokenURI = "https://example.com/token/2";

    // Mint token and get the tokenId
    const tx = await nft.connect(addr1).mintToken(tokenURI);
    const receipt = await tx.wait();
    const tokenId = receipt.events[0].args.tokenId;

    expect(await nft.tokenURI(tokenId)).to.equal(tokenURI);
  });

  it("Task 5: Should emit TokenMinted event when a token is minted", async function () {
    const tokenURI = "https://example.com/token/3";

    // Mint token and get the tokenId
    const tx = await nft.connect(addr1).mintToken(tokenURI);
    const receipt = await tx.wait();
    const tokenId = receipt.events[0].args.tokenId;

    // Retrieve the event from the logs
    const tokenMintedEvent = receipt.events.find(
      (event) => event.event === "TokenMinted"
    );

    // Check the emitted event
    expect(tokenMintedEvent.args.tokenId).to.equal(tokenId);
    expect(tokenMintedEvent.args.tokenURI).to.equal(tokenURI);
    expect(tokenMintedEvent.args.marketplaceAddress).to.equal(owner.address);
  });

  // it("Task 6: Should not allow minting by non-owners", async function () {
  //   const tokenURI = "https://example.com/token/4";

  //   // Attempt to mint token by a non-owner and expect the transaction to be reverted
  //   await expect(nft.connect(addr2).mintToken(tokenURI))
  //       .to.emit(nft, "TokenMinted")
  //       .withArgs(1, tokenURI, owner.address);

  //   await expect(nft.connect(addr2).mintToken(tokenURI))
  //       .to.be.revertedWith("ERC721: transfer caller is not owner nor approved");
  // });

  it("Task 6: Should return tokens owned by the caller", async function () {
    const tokenURI1 = "https://example.com/token/5";
    const tokenURI2 = "https://example.com/token/6";

    await nft.connect(addr1).mintToken(tokenURI1);
    await nft.connect(addr1).mintToken(tokenURI2);

    const tokensOwned = await nft.connect(addr1).getTokensOwnedByMe();

    expect(tokensOwned).to.have.lengthOf(2);
  });

  it("Task 7: Should return tokens created by the caller", async function () {
    const tokenURI1 = "https://example.com/token/7";
    const tokenURI2 = "https://example.com/token/8";

    await nft.connect(addr1).mintToken(tokenURI1);
    await nft.connect(addr2).mintToken(tokenURI2);

    const tokensCreated = await nft.connect(addr1).getTokensCreatedByMe();

    expect(tokensCreated).to.have.lengthOf(1);
  });

  it("Task 8: Should return the correct creator for a given token ID", async function () {
    const tokenURI = "https://example.com/token/9";

    // Mint token and get the tokenId
    const tx = await nft.connect(addr1).mintToken(tokenURI);
    const receipt = await tx.wait();
    const tokenId = receipt.events[0].args.tokenId;

    expect(await nft.getTokenCreatorById(tokenId)).to.equal(addr1.address);
  });
});

describe("3. Marketplace Contract Tests", function () {
  let Marketplace,
    marketplace,
    NFT,
    nft,
    Decentroz,
    decentroz,
    UserDetails,
    userDetails,
    owner,
    user1,
    user2;

  const listingFee = ethers.utils.parseEther("0.01");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy Decentroz token
    Decentroz = await ethers.getContractFactory("Decentroz");
    decentroz = await Decentroz.deploy();
    await decentroz.deployed();

    // Deploy the UserDetails contract
    UserDetails = await ethers.getContractFactory("UserDetails");
    userDetails = await UserDetails.deploy();
    await userDetails.deployed();

    // Deploy NFT token
    NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy(decentroz.address);
    await nft.deployed();

    // Deploy Marketplace
    Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(
      decentroz.address,
      userDetails.address,
      {
        value: listingFee,
      }
    );
    await marketplace.deployed();
    // console.log("Marketplace contract:", marketplace.address);

    // Mint Decentroz tokens for users
    await decentroz.mint(user1.address, ethers.utils.parseEther("1000"));
    await decentroz.mint(user2.address, ethers.utils.parseEther("1000"));
  });

  it("Test 1: Should create a market item", async function () {
    // Mint an NFT token
    await nft.connect(user1).mintToken("ipfs://123");

    // Ensure user1 approves the marketplace contract to transfer the NFT
    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create a market item
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));

    // Access marketItemIdToMarketItem using the public getter
    const marketItem = await marketplace.marketItemIdToMarketItem(1);
    expect(marketItem.creator).to.equal(user1.address);
    expect(marketItem.seller).to.equal(user1.address);
    expect(marketItem.price).to.equal(ethers.utils.parseEther("1"));
    expect(marketItem.sold).to.be.false;
    expect(marketItem.canceled).to.be.false;
  });

  it("Test 2: Should cancel a market item", async function () {
    /// Mint an NFT token
    await nft.connect(user1).mintToken("ipfs://123");

    // Ensure user1 approves the marketplace contract to transfer the NFT
    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create a market item
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));

    // Ensure that the user1 is the seller and the owner of the NFT
    const marketItem = await marketplace.marketItemIdToMarketItem(1);
    expect(marketItem.seller).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    // Cancel the market item
    await marketplace.connect(user1).cancelMarketItem(nft.address, 1);

    // Verify that the market item is canceled and the NFT is transferred back to the seller
    const updatedMarketItem = await marketplace.marketItemIdToMarketItem(1);
    expect(updatedMarketItem.canceled).to.be.true;
    expect(await nft.ownerOf(1)).to.equal(user1.address); // Check that the NFT is now held by the user1
  });

  it("Test 3: Should create a market sale with Ether", async function () {
    // Mint an NFT token
    await nft.connect(user1).mintToken("ipfs://123");

    // Ensure user1 approves the marketplace contract to transfer the NFT
    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create a market item
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));

    // Ensure that the user1 is the seller and the owner of the NFT
    const marketItem = await marketplace.marketItemIdToMarketItem(1);
    expect(marketItem.seller).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    // Purchase the market item with Ether
    await marketplace.connect(user2).createMarketSale(nft.address, 1, {
      value: ethers.utils.parseEther("1"),
    });

    // Verify that the market item is sold and the NFT is transferred to the buyer
    const updatedMarketItem = await marketplace.marketItemIdToMarketItem(1);
    expect(updatedMarketItem.sold).to.be.true;
    expect(await nft.ownerOf(1)).to.equal(user2.address); // Check that the NFT is now held by the user2
  });

  it("Test 4: Should create a market sale with ERC20", async function () {
    // Mint an NFT token
    await nft.connect(user1).mintToken("ipfs://123");

    // Ensure user1 approves the marketplace contract to transfer the NFT
    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create a market item
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));

    // Ensure that the user1 is the seller and the owner of the NFT
    const marketItem = await marketplace.marketItemIdToMarketItem(1);
    expect(marketItem.seller).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    // Set user2 as the admin of Decentroz contract
    await decentroz.connect(owner).setAdmin(user2.address);

    // Mint ERC20 tokens for user2
    await decentroz
      .connect(user2)
      .mint(user2.address, ethers.utils.parseEther("1"));

    // Approve the marketplace contract to spend ERC20 tokens on behalf of user2
    await decentroz
      .connect(user2)
      .approve(marketplace.address, ethers.utils.parseEther("1"));

    // Purchase the market item with ERC20 tokens
    await expect(
      marketplace
        .connect(user2)
        .createMarketSaleWithERC20(nft.address, 1, decentroz.address)
    ).to.not.be.reverted;

    // Verify that the market item is sold and the NFT is transferred to the buyer
    const updatedMarketItem = await marketplace.marketItemIdToMarketItem(1);
    expect(updatedMarketItem.sold).to.be.true;
    expect(await nft.ownerOf(1)).to.equal(user2.address); // Check that the NFT is now held by the user2
  });

  it("Test 5: Should fetch available market items", async function () {
    // Mint two NFT tokens
    await nft.connect(user1).mintToken("ipfs://123");
    await nft.connect(user1).mintToken("ipfs://456");

    // Ensure user1 approves the marketplace contract to transfer the NFTs
    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create two market items
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 2, ethers.utils.parseEther("2"));

    // Ensure that the user1 is the seller and the owner of the NFTs
    const marketItem1 = await marketplace.marketItemIdToMarketItem(1);
    expect(marketItem1.seller).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    const marketItem2 = await marketplace.marketItemIdToMarketItem(2);
    expect(marketItem2.seller).to.equal(user1.address);
    expect(await nft.ownerOf(2)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    // Fetch available market items
    const availableMarketItems = await marketplace.fetchAvailableMarketItems();

    // Verify that both market items are available
    expect(availableMarketItems.length).to.equal(2);
    // Note: Ensure that the comparison is done with BigNumber for numerical values
    expect(availableMarketItems[0].marketItemId.toNumber()).to.equal(0);
    expect(availableMarketItems[1].marketItemId.toNumber()).to.equal(1);
  });

  it("Test 6: Should fetch market items by seller address", async function () {
    // Mint two NFT tokens
    await nft.connect(user1).mintToken("ipfs://123");
    await nft.connect(user1).mintToken("ipfs://456");

    // Ensure user1 approves the marketplace contract to transfer the NFTs
    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create two market items
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 2, ethers.utils.parseEther("2"));

    // Ensure that the user1 is the seller and the owner of the NFTs
    const marketItem1 = await marketplace.marketItemIdToMarketItem(1);
    expect(marketItem1.seller).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    const marketItem2 = await marketplace.marketItemIdToMarketItem(2);
    expect(marketItem2.seller).to.equal(user1.address);
    expect(await nft.ownerOf(2)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    const sellerMarketItemsUser1 = await marketplace
      .connect(user1)
      .fetchMarketItemsByAddressProperty("seller");

    // console.log(sellerMarketItemsUser1);

    // User1 should have 1 market item
    expect(sellerMarketItemsUser1.length).to.equal(2);
    expect(sellerMarketItemsUser1[0].tokenId).to.equal(1);
    expect(sellerMarketItemsUser1[1].tokenId).to.equal(2);
  });

  it("Test 7: Should fetch market items by owner address", async function () {
    // Mint two NFT tokens
    await nft.connect(user1).mintToken("ipfs://123");
    await nft.connect(user1).mintToken("ipfs://456");

    // Ensure user1 approves the marketplace contract to transfer the NFTs
    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create two market items
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 2, ethers.utils.parseEther("2"));

    // Ensure that the user1 is the seller and the owner of the NFTs
    const marketItem1 = await marketplace.marketItemIdToMarketItem(1);
    expect(marketItem1.seller).to.equal(user1.address);
    expect(await nft.ownerOf(1)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    const marketItem2 = await marketplace.marketItemIdToMarketItem(2);
    expect(marketItem2.seller).to.equal(user1.address);
    expect(await nft.ownerOf(2)).to.equal(marketplace.address); // Check that the NFT is held by the marketplace

    // Fetch market items by owner address
    const ownerMarketItems = await marketplace
      .connect(user2)
      .fetchMarketItemsByAddressProperty("owner");

    // Verify that both market items are not fetched
    expect(ownerMarketItems.length).to.equal(0);
  });

  it("Test 8: Should transfer the Ownership of NFT", async function () {
    // Mint an NFT token
    await nft.connect(user1).mintToken("ipfs://123");

    await nft.connect(user1).setApprovalForAll(marketplace.address, true);

    // Create a market item for the NFT owned by user1
    await marketplace
      .connect(user1)
      .createMarketItem(nft.address, 1, ethers.utils.parseEther("1"));
    const marketItem = await marketplace.marketItemIdToMarketItem(1);

    // User2 approves the marketplace contract to transfer Decentroz tokens on their behalf
    await decentroz
      .connect(user2)
      .approve(marketplace.address, ethers.utils.parseEther("10"));

    // User2 purchases the NFT from the marketplace, providing the required payment
    await marketplace
      .connect(user2)
      .createMarketSale(nft.address, 1, { value: marketItem.price });

    // Ensure the ownership of the NFT has changed to user2
    const newOwner = await nft.ownerOf(1);
    expect(newOwner).to.equal(user2.address);
  });
});

describe("4. UserDetails Contract Tests", function () {
  let UserDetails, userDetails, owner, addr1, addr2;

  beforeEach(async function () {
    UserDetails = await ethers.getContractFactory("UserDetails");
    userDetails = await UserDetails.deploy();
    await userDetails.deployed();

    [owner, addr1, addr2] = await ethers.getSigners();
  });

  it("Test 1: Should register a new user", async function () {
    await userDetails
      .connect(addr1)
      .registerUser("User1", "Description1", true, false);

    const user = await userDetails.getUserDetails(addr1.address);
    expect(user.name).to.equal("User1");
    expect(user.description).to.equal("Description1");
    expect(user.totalNFTs).to.equal(0);
    expect(user.isBuyer).to.equal(true);
    expect(user.isSeller).to.equal(false);
  });

  it("Test 2: Should update user details", async function () {
    await userDetails
      .connect(addr1)
      .registerUser("User1", "Description1", true, false);
    await userDetails
      .connect(addr1)
      .updateUserDetails("NewName", "NewDescription");

    const user = await userDetails.getUserDetails(addr1.address);
    expect(user.name).to.equal("NewName");
    expect(user.description).to.equal("NewDescription");
  });

  it("Test 3: Should update user roles", async function () {
    await userDetails
      .connect(addr1)
      .registerUser("User1", "Description1", true, false);
    await userDetails.connect(addr1).updateRole(false, true);

    const user = await userDetails.getUserDetails(addr1.address);
    expect(user.isBuyer).to.equal(false);
    expect(user.isSeller).to.equal(true);
  });

  it("Test 4: Should increment total NFTs", async function () {
    await userDetails
      .connect(addr1)
      .registerUser("User1", "Description1", true, false);
    await userDetails.connect(addr1).incrementTotalNFTs();

    const user = await userDetails.getUserDetails(addr1.address);
    expect(user.totalNFTs).to.equal(1);
  });

  it("Test 5: Should prevent registering the same user twice", async function () {
    await userDetails.registerUser("User1", "Description1", true, false);

    await expect(
      userDetails.registerUser("User1", "Description1", true, false)
    ).to.be.revertedWith("User already registered");
  });

  it("Test 6: Should prevent updating details for a non-registered user", async function () {
    await expect(
      userDetails.updateUserDetails("NewName", "NewDescription")
    ).to.be.revertedWith("User not registered");
  });

  it("Test 7: Should prevent updating roles for a non-registered user", async function () {
    await expect(userDetails.updateRole(true, false)).to.be.revertedWith(
      "User not registered"
    );
  });

  it("Test 8: Should prevent incrementing total NFTs for a non-registered user", async function () {
    await expect(userDetails.incrementTotalNFTs()).to.be.revertedWith(
      "User not registered"
    );
  });
});
