# PokiWars Smart Contracts

This directory contains the smart contracts for the PokiWars game, including the PKT token contract and comprehensive tests.

## Contracts

### PokiToken.sol
An ERC20 token contract with additional functionality for marketplace operations:
- **Standard ERC20**: Transfer, approve, allowance, etc.
- **Marketplace Integration**: Special functions for marketplace to burn and spend tokens
- **Owner Controls**: Only owner can set marketplace address
- **Events**: Custom events for marketplace operations

## Setup

1. **Install Dependencies**
   ```bash
   cd web3
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the web3 directory:
   ```env
   PRIVATE_KEY=your_private_key_here
   POLYGON_RPC_URL=https://polygon-rpc.com/
   POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology/
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   ```

3. **Compile Contracts**
   ```bash
   npm run compile
   ```

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run test:gas
```

### Test Coverage

The test suite covers:

#### **Deployment Tests**
- ✅ Correct owner assignment
- ✅ Initial supply minting (100,000 PKT)
- ✅ Token name, symbol, and decimals

#### **Standard ERC20 Functions**
- ✅ Transfer between accounts
- ✅ Approve and transferFrom
- ✅ Balance and allowance checks
- ✅ Error handling for insufficient funds/allowance

#### **Marketplace Functions**
- ✅ `setMarketplace()` - Only owner can set marketplace
- ✅ `burnFrom()` - Marketplace can burn user tokens (with allowance)
- ✅ `spendFrom()` - Marketplace can spend user tokens (with allowance)

#### **Edge Cases**
- ✅ Zero amount operations
- ✅ Maximum uint256 values
- ✅ Partial allowances
- ✅ Multiple user scenarios

#### **Events**
- ✅ Transfer events
- ✅ Approval events
- ✅ Custom marketplace events (TokensBurned, TokensSpent)

## Deployment

### Local Development
```bash
# Start local Hardhat node
npm run node

# Deploy to local network (in another terminal)
npm run deploy:local
```

### Polygon Testnet (Amoy)
```bash
npm run deploy:amoy
```

### Polygon Mainnet
```bash
npm run deploy:polygon
```

## Contract Address

The deployed contract address is: `0x80e044c711a6904950ff6cbb8f3bdb18877be483`

## Usage Examples

### Basic Token Operations
```javascript
// Transfer tokens
await pokiToken.transfer(userAddress, ethers.parseEther("1000"));

// Approve spending
await pokiToken.approve(marketplaceAddress, ethers.parseEther("500"));

// Check balance
const balance = await pokiToken.balanceOf(userAddress);
```

### Marketplace Operations
```javascript
// Set marketplace (owner only)
await pokiToken.setMarketplace(marketplaceAddress);

// User approves marketplace
await pokiToken.connect(user).approve(marketplaceAddress, amount);

// Marketplace burns tokens
await pokiToken.connect(marketplace).burnFrom(userAddress, amount);

// Marketplace spends tokens
await pokiToken.connect(marketplace).spendFrom(userAddress, amount);
```

## Gas Optimization

The contract is optimized for gas efficiency:
- Uses OpenZeppelin's optimized ERC20 implementation
- Minimal custom functions
- Efficient event emissions
- Compiler optimizations enabled (200 runs)

## Security Features

- **Access Control**: Only owner can set marketplace
- **Allowance System**: Marketplace operations require user approval
- **Input Validation**: Proper checks for amounts and addresses
- **Event Logging**: All operations emit events for transparency

## Integration with Frontend

The contract integrates with your existing frontend through:

1. **Token Service**: `server/services/tokenService.js`
2. **API Endpoints**: `/transfer-tokens` endpoint
3. **Client Integration**: `client/src/lib/api/tokenApi.js`

## Verification

After deployment, verify the contract on PolygonScan:

```bash
# Verify on Polygon Mainnet
npm run verify:polygon

# Verify on Polygon Amoy
npm run verify:amoy
```

## Troubleshooting

### Common Issues

1. **"Only marketplace can burn/spend tokens"**
   - Ensure the caller is the set marketplace address
   - Check that `setMarketplace()` was called

2. **"ERC20: insufficient allowance"**
   - User must approve the marketplace first
   - Check allowance with `allowance(user, marketplace)`

3. **"ERC20: transfer amount exceeds balance"**
   - User doesn't have enough tokens
   - Check balance with `balanceOf(user)`

### Gas Issues

If transactions fail due to gas:
- Increase gas limit in your transaction
- Check current gas prices on Polygon
- Use gas estimation: `contract.estimateGas.functionName()`

## License

MIT License - see LICENSE file for details.
