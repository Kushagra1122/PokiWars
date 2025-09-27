# PKT Token Transfer Scripts

This directory contains scripts to transfer PKT tokens between addresses.

## Scripts Available

### 1. `transfer-pkt-tokens.js` (Hardhat version)
Uses Hardhat framework to interact with the deployed contract.

**Usage:**
```bash
# Navigate to web3 directory
cd web3

# Run the transfer script
npm run transfer:pkt
# OR
npx hardhat run scripts/transfer-pkt-tokens.js --network polygon
```

### 2. `standalone-transfer.js` (Standalone version)
Uses only ethers.js without Hardhat dependency.

**Usage:**
```bash
# Navigate to web3 directory
cd web3

# Install ethers if not already installed
npm install ethers

# Run the standalone script
node scripts/standalone-transfer.js
```

## Configuration

The scripts are configured with the following parameters:

- **Private Key**: `947dfbad2bf17bd1fdca3f21814b48934b10ad98fa70812ad629e5d9baf1fd24`
- **Contract Address**: `0xa599dac243deca9b35c57639dc1dfb1f3368e26b`
- **From Address**: `0x71F22eDd5B4df27C61BcddAE69DF63a9a012c127`
- **To Address**: `0x5c084030bF97C84ed3873b731e77e6dBDEdcB1E9`
- **Transfer Amount**: `500 PKT`

## What the Scripts Do

1. **Connect to Polygon Network**: Uses Polygon mainnet RPC
2. **Create Wallet**: Creates wallet from the provided private key
3. **Connect to Contract**: Attaches to the deployed PokiToken contract
4. **Check Balances**: Verifies sufficient balance for transfer
5. **Handle Allowances**: If transferring from a different address, checks and sets allowance
6. **Execute Transfer**: Performs the token transfer
7. **Confirm Transaction**: Waits for transaction confirmation
8. **Verify Transfer**: Confirms the transfer was successful

## Error Handling

The scripts include comprehensive error handling for:
- Insufficient balance
- Insufficient allowance
- Network connection issues
- Transaction failures
- Gas estimation problems

## Security Note

⚠️ **WARNING**: The private key is hardcoded in these scripts for demonstration purposes. In production, always use environment variables or secure key management systems.

## Network Requirements

- Polygon mainnet RPC access
- Sufficient MATIC for gas fees
- Valid private key with PKT token balance
