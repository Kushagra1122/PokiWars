// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PokiToken is ERC20, Ownable {
    // Address authorized as the marketplace contract
    address public marketplace;

    event MarketplaceUpdated(address indexed newMarketplace);
    event TokensBurned(address indexed burner, uint256 amount);
    event TokensSpent(address indexed spender, uint256 amount);

    constructor() ERC20("PokiToken", "PKT") Ownable(msg.sender) {
        _mint(msg.sender, 100000 * 10 ** decimals());
    }

    // Owner can set the marketplace contract address
    function setMarketplace(address _marketplace) external onlyOwner {
        marketplace = _marketplace;
        emit MarketplaceUpdated(_marketplace);
    }

    // Allow the marketplace contract to burn tokens on behalf of user (requires allowance)
    function burnFrom(address account, uint256 amount) external {
        require(msg.sender == marketplace, "Only marketplace can burn tokens");
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);
        emit TokensBurned(account, amount);
    }

    // Allow the marketplace contract to spend tokens by transferFrom caller to marketplace (requires allowance)
    function spendFrom(address account, uint256 amount) external {
        require(msg.sender == marketplace, "Only marketplace can spend tokens");
        _spendAllowance(account, msg.sender, amount);
        _transfer(account, marketplace, amount);
        emit TokensSpent(account, amount);
    }
}
