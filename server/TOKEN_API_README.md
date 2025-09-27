# Token Transfer API

Simple API endpoint to transfer 500 PokiTokens from the contract owner to any address.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables (create a .env file or set them directly):
```bash
PRIVATE_KEY=your_private_key_here
```

**Important Private Key Format:**
- Must be 64 hexadecimal characters (0-9, a-f, A-F)
- Do NOT include the '0x' prefix
- Example: `PRIVATE_KEY=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`
- Get your private key from MetaMask: Account Details > Export Private Key

**Note:** RPC URL and contract address are hardcoded:
- RPC: Polygon Mainnet (`https://polygon-rpc.com/`)
- Contract: `0x80e044c711a6904950ff6cbb8f3bdb18877be483`

## API Endpoints

### POST /transfer-tokens

Transfers 500 PokiTokens from the contract owner to the specified address.

**Request Body:**
```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

**Response (Success):**
```json
{
  "success": true,
  "transactionHash": "0x...",
  "blockNumber": 12345,
  "from": "0x...",
  "to": "0x1234567890123456789012345678901234567890",
  "amount": "500",
  "gasUsed": "21000"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error message"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Usage Example

```bash
curl -X POST http://localhost:3001/transfer-tokens \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890123456789012345678901234567890"}'
```

## Notes

- The contract owner must have at least 500 tokens
- The API uses the private key from environment variables to sign transactions
- Uses Polygon Mainnet RPC
- Contract address is hardcoded: `0x80e044c711a6904950ff6cbb8f3bdb18877be483`
