// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./NFT.sol";
import "./Decentroz.sol";
import "./UserDetails.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Marketplace is ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private _marketItemIds;
    Counters.Counter private _tokensSold;
    Counters.Counter private _tokensCanceled;

    address payable private owner;
    Decentroz public decentroz;
    UserDetails public userDetails;
    uint256 private listingFee;

    struct MarketItem {
        uint256 marketItemId;
        address nftContractAddress;
        uint256 tokenId;
        address payable creator;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
        bool canceled;
    }

    mapping(uint256 => MarketItem) public marketItemIdToMarketItem;

    event MarketItemCreated(
        uint256 indexed marketItemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address creator,
        address seller,
        address owner,
        uint256 price,
        bool sold,
        bool canceled
    );

    constructor(address _decentroz, address _userDetails) payable {
        owner = payable(msg.sender);
        decentroz = Decentroz(_decentroz);
        userDetails = UserDetails(_userDetails);
    }

    function createMarketItem(
        address nftContractAddress,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant returns (uint256) {
        require(price > 0, "Price must be at least 1 wei");
        require(
            msg.value == listingFee,
            "Price must be equal to listing price"
        );
        _marketItemIds.increment();
        uint256 marketItemId = _marketItemIds.current();
        address creator = NFT(nftContractAddress).getTokenCreatorById(tokenId);
        marketItemIdToMarketItem[marketItemId] = MarketItem(
            marketItemId,
            nftContractAddress,
            tokenId,
            payable(creator),
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            false
        );
        updateUserDetails(msg.sender, false, true);

        IERC721(nftContractAddress).transferFrom(
            msg.sender,
            address(this),
            tokenId
        );

        emit MarketItemCreated(
            marketItemId,
            nftContractAddress,
            tokenId,
            payable(creator),
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            false
        );
        return marketItemId;
    }

    function cancelMarketItem(
        address nftContractAddress,
        uint256 marketItemId
    ) public payable nonReentrant {
        uint256 tokenId = marketItemIdToMarketItem[marketItemId].tokenId;
        require(tokenId > 0, "Market item has to exist");
        require(
            marketItemIdToMarketItem[marketItemId].seller == msg.sender,
            "You are not the seller"
        );

        IERC721(nftContractAddress).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        updateUserDetails(msg.sender, false, true);
        marketItemIdToMarketItem[marketItemId].owner = payable(msg.sender);
        marketItemIdToMarketItem[marketItemId].canceled = true;
        _tokensCanceled.increment();
    }

    function createMarketSale(
        address nftContractAddress,
        uint256 marketItemId
    ) public payable nonReentrant {
        uint256 price = marketItemIdToMarketItem[marketItemId].price;
        uint256 tokenId = marketItemIdToMarketItem[marketItemId].tokenId;
        require(
            msg.value == price,
            "Please submit the asking price to continue"
        );
        updateUserDetails(msg.sender, true, false);
        marketItemIdToMarketItem[marketItemId].owner = payable(msg.sender);
        marketItemIdToMarketItem[marketItemId].sold = true;
        marketItemIdToMarketItem[marketItemId].seller.transfer(msg.value);
        IERC721(nftContractAddress).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        _tokensSold.increment();
        payable(owner).transfer(listingFee);
    }

    function fetchAvailableMarketItems()
        public
        view
        returns (MarketItem[] memory)
    {
        uint256 itemsCount = _marketItemIds.current();
        uint256 soldItemsCount = _tokensSold.current();
        uint256 canceledItemsCount = _tokensCanceled.current();
        uint256 availableItemsCount = itemsCount -
            soldItemsCount -
            canceledItemsCount;
        MarketItem[] memory marketItems = new MarketItem[](availableItemsCount);
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < itemsCount; i++) {
            MarketItem memory item = marketItemIdToMarketItem[i];
            if (item.owner != address(0)) continue;
            marketItems[currentIndex] = item;
            currentIndex += 1;
        }
        return marketItems;
    }

    function getMarketItemAddressByProperty(
        MarketItem memory item,
        string memory property
    ) private pure returns (address) {
        require(
            compareStrings(property, "seller") ||
                compareStrings(property, "owner"),
            "Parameter must be 'seller' or 'owner'"
        );

        return compareStrings(property, "seller") ? item.seller : item.owner;
    }

    function fetchMarketItemsByAddressProperty(
        string memory _addressProperty
    ) public view returns (MarketItem[] memory) {
        require(
            compareStrings(_addressProperty, "seller") ||
                compareStrings(_addressProperty, "owner"),
            "Parameter must be 'seller' or 'owner'"
        );
        uint256 totalItemsCount = _marketItemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalItemsCount; i++) {
            MarketItem storage item = marketItemIdToMarketItem[i + 1];
            address addressPropertyValue = getMarketItemAddressByProperty(
                item,
                _addressProperty
            );
            if (addressPropertyValue != msg.sender) continue;
            itemCount += 1;
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemsCount; i++) {
            MarketItem storage item = marketItemIdToMarketItem[i + 1];
            address addressPropertyValue = getMarketItemAddressByProperty(
                item,
                _addressProperty
            );
            if (addressPropertyValue != msg.sender) continue;
            items[currentIndex] = item;
            currentIndex += 1;
        }
        return items;
    }

    function createMarketSaleWithERC20(
        address nftContractAddress,
        uint256 marketItemId,
        IERC20 erc20Token
    ) public nonReentrant {
        uint256 price = marketItemIdToMarketItem[marketItemId].price;
        uint256 tokenId = marketItemIdToMarketItem[marketItemId].tokenId;
        require(
            erc20Token.balanceOf(msg.sender) >= price,
            "Insufficient ERC20 balance"
        );
        marketItemIdToMarketItem[marketItemId].owner = payable(msg.sender);
        marketItemIdToMarketItem[marketItemId].sold = true;
        erc20Token.transferFrom(
            msg.sender,
            marketItemIdToMarketItem[marketItemId].seller,
            price
        );

        IERC721(nftContractAddress).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
        _tokensSold.increment();
        erc20Token.transfer(owner, listingFee);
    }

    function compareStrings(
        string memory a,
        string memory b
    ) private pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function updateUserDetails(
        address user,
        bool isBuyer,
        bool isSeller
    ) internal {
        uint256 totalNFTs = userDetails.getTokenCount(user);

        // Increment or decrement totalNFTs based on the role
        if (isBuyer) {
            unchecked {
                totalNFTs += 1;
            }
        }
        if (isSeller) {
            // Ensure totalNFTs is greater than or equal to 1 before decrementing
            require(totalNFTs >= 0, "Insufficient NFTs to decrement");
            unchecked {
                totalNFTs -= 1;
            }
        }

        // Update user details in the registry
        userDetails.updateTokencount(user, totalNFTs);
    }
}
