// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// Import OpenZeppelin contracts via GitHub for Remix
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.0/contracts/access/Ownable.sol";

interface IPokiToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract PokiNFT is ERC721Enumerable, Ownable {
    struct NFTAttributes {
        uint256 level;
        uint256 xp;
        uint256 health;
        uint256 attack;
        uint256 defense;
        uint256 speed;
        uint256 radius;
        uint256 specialTrait;
    }

    mapping(uint256 => NFTAttributes) private _attributes;
    mapping(uint256 => string) private _tokenURIs;

    IPokiToken public pokiToken;

    uint256 public mintCost = 100 * 10**18;       // Example: 100 PokiTokens to mint
    uint256 public levelUpCost = 50 * 10**18;     // Example: 50 PokiTokens per 100 XP

    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTLeveledUp(uint256 indexed tokenId, uint256 newLevel, NFTAttributes newAttributes);

    constructor(address _pokiTokenAddress) ERC721("PokiNFT", "PKNFT") {
        pokiToken = IPokiToken(_pokiTokenAddress);
    }

    // Implement required _baseURI override to fix abstract contract error
    function _baseURI() internal view virtual override returns (string memory) {
        return "";
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }


    // Mint NFT with full dynamic attributes and metadata URI
    function mintNFT(
        address to,
        uint256 tokenId,
        string memory metadataURI,
        uint256 level,
        uint256 xp,
        uint256 health,
        uint256 attack,
        uint256 defense,
        uint256 speed,
        uint256 radius,
        uint256 specialTrait
    ) external {
        require(!_exists(tokenId), "Token already minted");

        // Transfer PokiTokens from sender to owner to pay mint cost
        require(
            pokiToken.transferFrom(msg.sender, owner(), mintCost),
            "PokiToken payment failed"
        );

        _safeMint(to, tokenId);

        // Initialize NFT attributes from input
        _attributes[tokenId] = NFTAttributes({
            level: level,
            xp: xp,
            health: health,
            attack: attack,
            defense: defense,
            speed: speed,
            radius: radius,
            specialTrait: specialTrait
        });

        _tokenURIs[tokenId] = metadataURI;

        emit NFTMinted(to, tokenId);
    }

    // Gain XP on NFT by paying PokiTokens
    function gainXP(uint256 tokenId, uint256 xpAmount) external {
        require(_exists(tokenId), "Nonexistent token");
        require(msg.sender == ownerOf(tokenId), "Only NFT owner can upgrade");

        uint256 chunks = xpAmount / 100;
        require(chunks > 0, "XP amount must be multiple of 100 for payment");

        uint256 cost = chunks * levelUpCost;
        require(pokiToken.transferFrom(msg.sender, owner(), cost), "PokiToken payment failed");

        NFTAttributes storage attr = _attributes[tokenId];
        attr.xp += xpAmount;

        uint256 newLevel = (attr.xp / 100) + 1;

        if (newLevel > attr.level) {
            _levelUp(tokenId, newLevel);
        }
    }

    function _levelUp(uint256 tokenId, uint256 newLevel) internal {
        NFTAttributes storage attr = _attributes[tokenId];
        attr.level = newLevel;

        // Increase stats by 5% on level up
        attr.health = (attr.health * 105) / 100;
        attr.attack = (attr.attack * 105) / 100;
        attr.defense = (attr.defense * 105) / 100;
        attr.speed = (attr.speed * 105) / 100;
        attr.radius = (attr.radius * 105) / 100;

        emit NFTLeveledUp(tokenId, newLevel, attr);
    }

    // Public getter for NFT attributes
    function getAttributes(uint256 tokenId) external view returns (NFTAttributes memory) {
        require(_exists(tokenId), "Nonexistent token");
        return _attributes[tokenId];
    }

    // Set tokenURI manually (override if needed)
    function setTokenURI(uint256 tokenId, string calldata uri) external onlyOwner {
        require(_exists(tokenId), "Nonexistent token");
        _tokenURIs[tokenId] = uri;
    }

    // Override tokenURI to return stored metadata URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Nonexistent token");
        return _tokenURIs[tokenId];
    }

    // Owner can update mint and level-up costs
    function setMintCost(uint256 newCost) external onlyOwner {
        mintCost = newCost;
    }

    function setLevelUpCost(uint256 newCost) external onlyOwner {
        levelUpCost = newCost;
    }
}
