// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IPokiToken is IERC20 {
    function spendFrom(address account, uint256 amount) external;
}

contract Player is Ownable, ReentrancyGuard {
    // ---------------------
    // STRUCTS
    // ---------------------
    struct PlayerData {
        string username;           // Unique username
        uint256 ftBalance;         // On-chain in-game currency
        uint256 pokemonCount;      // Number of NFTs collected
        uint256[] nftIds;          // NFT token IDs owned
        uint256[] inventoryItemIds;// ItemMarketplace IDs owned
        bool exists;               // Registered flag
    }

    // ---------------------
    // STATE
    // ---------------------
    IPokiToken public pokiToken; // can be set later via function
    mapping(address => PlayerData) private players;
    mapping(string => address) private usernameToAddress;

    // ---------------------
    // EVENTS
    // ---------------------
    event PlayerRegistered(address indexed player, string username);
    event UsernameUpdated(address indexed player, string oldUsername, string newUsername);
    event NFTAdded(address indexed player, uint256 tokenId);
    event NFTRemoved(address indexed player, uint256 tokenId);
    event ItemAdded(address indexed player, uint256 itemId);
    event ItemRemoved(address indexed player, uint256 itemId);
    event FTMinted(address indexed player, uint256 amount);
    event FTSpent(address indexed player, uint256 amount);
    event PokiTokenDeposited(address indexed player, uint256 amount);
    event PokiTokenWithdrawn(address indexed player, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ---------------------
    // ADMIN FUNCTIONS
    // ---------------------
    function setPokiToken(address _pokiToken) external onlyOwner {
        pokiToken = IPokiToken(_pokiToken);
    }

    // ---------------------
    // PLAYER REGISTRATION
    // ---------------------
    function register(string calldata _username) external {
        require(!players[msg.sender].exists, "Player already registered");
        require(usernameToAddress[_username] == address(0), "Username taken");

        players[msg.sender].username = _username;
        players[msg.sender].exists = true;
        usernameToAddress[_username] = msg.sender;

        emit PlayerRegistered(msg.sender, _username);
    }

    function updateUsername(string calldata _newUsername) external {
        require(players[msg.sender].exists, "Player not registered");
        require(usernameToAddress[_newUsername] == address(0), "Username taken");

        string memory oldUsername = players[msg.sender].username;
        usernameToAddress[oldUsername] = address(0);

        players[msg.sender].username = _newUsername;
        usernameToAddress[_newUsername] = msg.sender;

        emit UsernameUpdated(msg.sender, oldUsername, _newUsername);
    }

    function isUsernameTaken(string calldata _username) external view returns (bool) {
        return usernameToAddress[_username] != address(0);
    }

    function getUsername(address _player) external view returns (string memory) {
        return players[_player].username;
    }

    // ---------------------
    // NFT MANAGEMENT
    // ---------------------
    function addNFT(uint256 tokenId) external onlyOwner {
        players[msg.sender].nftIds.push(tokenId);
        players[msg.sender].pokemonCount++;
        emit NFTAdded(msg.sender, tokenId);
    }

    function removeNFT(uint256 tokenId) external onlyOwner {
        uint256[] storage nfts = players[msg.sender].nftIds;
        bool found = false;
        for (uint256 i = 0; i < nfts.length; i++) {
            if (nfts[i] == tokenId) {
                nfts[i] = nfts[nfts.length - 1];
                nfts.pop();
                players[msg.sender].pokemonCount--;
                found = true;
                emit NFTRemoved(msg.sender, tokenId);
                break;
            }
        }
        require(found, "NFT not found in inventory");
    }

    function getNFTs(address _player) external view returns (uint256[] memory) {
        return players[_player].nftIds;
    }

    // ---------------------
    // INVENTORY MANAGEMENT
    // ---------------------
    function addItem(uint256 itemId) external onlyOwner {
        players[msg.sender].inventoryItemIds.push(itemId);
        emit ItemAdded(msg.sender, itemId);
    }

    function removeItem(uint256 itemId) external onlyOwner {
        uint256[] storage items = players[msg.sender].inventoryItemIds;
        bool found = false;
        for (uint256 i = 0; i < items.length; i++) {
            if (items[i] == itemId) {
                items[i] = items[items.length - 1];
                items.pop();
                found = true;
                emit ItemRemoved(msg.sender, itemId);
                break;
            }
        }
        require(found, "Item not found in inventory");
    }

    function getInventory(address _player) external view returns (uint256[] memory) {
        return players[_player].inventoryItemIds;
    }

    // ---------------------
    // FT MANAGEMENT
    // ---------------------
    function mintFT(uint256 amount) external onlyOwner {
        players[msg.sender].ftBalance += amount;
        emit FTMinted(msg.sender, amount);
    }

    function spendFT(uint256 amount) external {
        require(players[msg.sender].ftBalance >= amount, "Insufficient FT balance");
        players[msg.sender].ftBalance -= amount;
        emit FTSpent(msg.sender, amount);
    }

    function getFTBalance(address _player) external view returns (uint256) {
        return players[_player].ftBalance;
    }

    // ---------------------
    // POKITOKEN INTEGRATION (optional, set later)
    // ---------------------
    function depositPokiToken(uint256 amount) external nonReentrant {
        require(address(pokiToken) != address(0), "PokiToken not set");
        require(pokiToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        players[msg.sender].ftBalance += amount;
        emit PokiTokenDeposited(msg.sender, amount);
    }

    function withdrawPokiToken(uint256 amount) external nonReentrant {
        require(address(pokiToken) != address(0), "PokiToken not set");
        require(players[msg.sender].ftBalance >= amount, "Insufficient balance");
        players[msg.sender].ftBalance -= amount;
        require(pokiToken.transfer(msg.sender, amount), "Token transfer failed");
        emit PokiTokenWithdrawn(msg.sender, amount);
    }

    // ---------------------
    // PLAYER OVERVIEW
    // ---------------------
    function getPlayerData(address _player) external view returns (
        string memory username,
        uint256 ftBalance,
        uint256 pokemonCount,
        uint256[] memory nftIds,
        uint256[] memory inventory
    ) {
        PlayerData storage p = players[_player];
        return (p.username, p.ftBalance, p.pokemonCount, p.nftIds, p.inventoryItemIds);
    }
}
