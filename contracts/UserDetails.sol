// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract UserDetails {
    struct User {
        string name;
        string description;
        uint256 totalNFTs;
        bool isBuyer;
        bool isSeller;
    }

    mapping(address => User) public users;

    event UserRegistered(
        address indexed userAddress,
        string name,
        string description,
        bool isBuyer,
        bool isSeller
    );

    function registerUser(
        string memory _name,
        string memory _description,
        bool _isBuyer,
        bool _isSeller
    ) external {
        require(!userExists(msg.sender), "User already registered");

        users[msg.sender] = User({
            name: _name,
            description: _description,
            totalNFTs: 0,
            isBuyer: _isBuyer,
            isSeller: _isSeller
        });

        emit UserRegistered(
            msg.sender,
            _name,
            _description,
            _isBuyer,
            _isSeller
        );
    }

    function getUserDetails(
        address userAddress
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 totalNFTs,
            bool isBuyer,
            bool isSeller
        )
    {
        User storage user = users[userAddress];
        return (
            user.name,
            user.description,
            user.totalNFTs,
            user.isBuyer,
            user.isSeller
        );
    }

    function getTokenCount(
        address userAddress
    ) external view returns (uint256) {
        return users[userAddress].totalNFTs;
    }

    function updateTokencount(
        address userAddress,
        uint256 tokenCount
    ) external {
        users[userAddress].totalNFTs = tokenCount;
    }

    function updateUserComplete(
        address user,
        string memory name,
        string memory description,
        uint256 totalNFTs,
        bool isBuyer,
        bool isSeller
    ) external {
        users[user] = User(name, description, totalNFTs, isBuyer, isSeller);
    }

    function updateUserDetails(
        string memory _name,
        string memory _description
    ) external {
        require(userExists(msg.sender), "User not registered");

        users[msg.sender].name = _name;
        users[msg.sender].description = _description;
    }

    function updateRole(bool _isBuyer, bool _isSeller) external {
        require(userExists(msg.sender), "User not registered");

        users[msg.sender].isBuyer = _isBuyer;
        users[msg.sender].isSeller = _isSeller;
    }

    function incrementTotalNFTs() external {
        require(userExists(msg.sender), "User not registered");

        users[msg.sender].totalNFTs += 1;
    }

    function userExists(address userAddress) public view returns (bool) {
        return bytes(users[userAddress].name).length != 0;
    }
}
