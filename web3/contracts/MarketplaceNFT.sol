// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IPokiNFT is IERC721 {
    // Optional: if you want to check attributes, add getter here
}

interface IPokiToken is IERC20 {
    function spendFrom(address account, uint256 amount) external;
}

contract PokiMarketplace is Ownable(msg.sender) {
    struct Listing {
        address seller;
        uint256 price;   // Price in PokiToken
    }

    // nftContract => tokenId => listing
    mapping(address => mapping(uint256 => Listing)) public listings;

    IPokiToken public pokiToken;

    event NFTListed(address indexed nftContract, uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTSold(address indexed nftContract, uint256 indexed tokenId, address indexed buyer, uint256 price);
    event NFTDelisted(address indexed nftContract, uint256 indexed tokenId, address indexed seller);

    constructor(address _pokiTokenAddress) {
        pokiToken = IPokiToken(_pokiTokenAddress);
    }

    /** 
     * List NFT for sale
     * @param nftContract address of ERC721 contract
     * @param tokenId ID of NFT to sell
     * @param price Price in PokiToken
     */
    function listNFT(address nftContract, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.isApprovedForAll(msg.sender, address(this)) || nft.getApproved(tokenId) == address(this), "Marketplace not approved");

        listings[nftContract][tokenId] = Listing({
            seller: msg.sender,
            price: price
        });

        emit NFTListed(nftContract, tokenId, msg.sender, price);
    }

    /** 
     * Buy NFT
     * @param nftContract address of ERC721 contract
     * @param tokenId ID of NFT to buy
     */
    function buyNFT(address nftContract, uint256 tokenId) external {
        Listing memory item = listings[nftContract][tokenId];
        require(item.price > 0, "NFT not for sale");

        // Transfer PokiToken from buyer to seller
        pokiToken.spendFrom(msg.sender, item.price);

        // Transfer NFT to buyer
        IERC721(nftContract).safeTransferFrom(item.seller, msg.sender, tokenId);

        // Remove listing
        delete listings[nftContract][tokenId];

        emit NFTSold(nftContract, tokenId, msg.sender, item.price);
    }

    /** 
     * Delist NFT
     * @param nftContract address of ERC721 contract
     * @param tokenId ID of NFT
     */
    function delistNFT(address nftContract, uint256 tokenId) external {
        Listing memory item = listings[nftContract][tokenId];
        require(item.seller == msg.sender, "Not seller");
        delete listings[nftContract][tokenId];
        emit NFTDelisted(nftContract, tokenId, msg.sender);
    }

    /** 
     * Get NFT listing
     */
    function getListing(address nftContract, uint256 tokenId) external view returns (Listing memory) {
        return listings[nftContract][tokenId];
    }
}
