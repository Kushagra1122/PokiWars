# Daily Rewards System with x402 Protocol

A daily rewards system that distributes 10 PKT tokens to users once every 24 hours using the x402 payment protocol on Polygon.

## Overview

This implementation features:
- **x402 Protocol Integration**: Uses HTTP 402 Payment Required responses for cooldown management
- **Daily Token Distribution**: 10 PKT tokens per user per day
- **Simple Local Database**: JSON-based storage for MVP development
- **Polygon Network**: Low-cost, fast token transfers
- **Reverse Payment Model**: Server pays rewards to users (inverse of typical x402 flow)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Agent   │    │   Game Server   │    │  Polygon Chain  │
│                 │    │                 │    │                 │
│  1. Request     │───▶│  2. Check       │    │                 │
│     Reward      │    │     Eligibility │    │                 │
│                 │    │                 │    │                 │
│  4. Receive     │◀───│  3. Send 10 PKT │───▶│  Token Transfer │
│     Response    │    │     (if eligible)│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### 1. Claim Daily Reward (x402 Flow)
```http
POST /claim-daily-reward
Content-Type: application/json

{
  "address": "0x1234567890123456789012345678901234567890"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Daily reward claimed successfully!",
  "x402": {
    "type": "reward_granted",
    "paymentType": "reverse_payment",
    "amount": "10 PKT",
    "network": "polygon",
    "transactionHash": "0x..."
  },
  "reward": {
    "amount": "10",
    "token": "PKT",
    "transactionHash": "0x...",
    "blockNumber": 12345,
    "claimDate": "2024-01-01T00:00:00.000Z"
  },
  "userStats": {
    "address": "0x...",
    "totalClaims": 1,
    "lastClaimTime": 1704067200000
  }
}
```

**x402 Payment Required Response (402):**
```json
{
  "success": false,
  "error": "Daily reward not available yet",
  "code": "PAYMENT_REQUIRED",
  "x402": {
    "type": "daily_reward_cooldown",
    "message": "Daily reward can only be claimed once every 24 hours",
    "nextAvailable": "2024-01-02T00:00:00.000Z",
    "hoursRemaining": 12,
    "minutesRemaining": 30
  }
}
```

### 2. Get Reward Status
```http
GET /reward-status/{address}
```

**Response:**
```json
{
  "success": true,
  "userAddress": "0x...",
  "history": {
    "hasHistory": true,
    "userStats": {
      "totalClaims": 5,
      "lastClaimTime": 1704067200000
    },
    "nextClaimIn": "12h 30m"
  },
  "eligibility": {
    "eligible": false,
    "reason": "too_soon",
    "hoursRemaining": 12
  },
  "x402": {
    "canClaim": false,
    "nextRewardValue": "10 PKT",
    "claimEndpoint": "/claim-daily-reward"
  }
}
```

### 3. System Statistics
```http
GET /rewards-stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalClaims": 850,
    "totalTokensDistributed": "8500",
    "systemUptime": 86400000
  },
  "x402": {
    "protocol": "daily_rewards",
    "rewardAmount": "10 PKT",
    "network": "polygon",
    "claimCooldown": "24 hours"
  }
}
```

### 4. Protocol Information
```http
GET /reward-info
```

**Response:**
```json
{
  "success": true,
  "x402": {
    "protocol": "daily_rewards",
    "version": "1.0.0",
    "paymentType": "reverse_payment",
    "description": "Daily PKT token rewards for PokiWars players"
  },
  "reward": {
    "amount": "10",
    "token": "PKT",
    "network": "polygon",
    "cooldown": "24 hours"
  },
  "endpoints": {
    "claim": "/claim-daily-reward",
    "status": "/reward-status/{address}",
    "stats": "/rewards-stats",
    "info": "/reward-info"
  }
}
```

## x402 Protocol Implementation

### Standard x402 vs Reverse Payment Model

**Traditional x402:**
- Client pays server for access/service
- HTTP 402 means "payment required to proceed"

**Our Daily Rewards (Reverse x402):**
- Server pays client (rewards distribution)
- HTTP 402 means "reward not yet available due to cooldown"
- Uses x402 response format for consistency

### x402 Response Codes

- **200**: Reward successfully distributed
- **402**: Reward not available (cooldown active)
- **400**: Invalid request (bad address, etc.)
- **500**: Server error

## Database Schema

The rewards system uses a simple JSON file database located at `server/data/rewards.json`:

```json
{
  "userClaims": {
    "0x123...": {
      "address": "0x123...",
      "lastClaimTime": 1704067200000,
      "totalClaims": 3,
      "transactionHash": "0x...",
      "lastClaimDate": "2024-01-01T00:00:00.000Z"
    }
  },
  "metadata": {
    "created": 1704067200000,
    "lastUpdate": 1704067200000,
    "totalClaims": 10,
    "totalTokensDistributed": "100"
  }
}
```

## Testing

Run the test suite:
```bash
node test-rewards.js
```

This will test:
- Service initialization
- First-time user eligibility
- Reward claiming process
- Cooldown enforcement
- Database operations
- x402 response handling

## Security Considerations

⚠️ **MVP Security Notes:**
- No authentication required (open reward claims)
- Simple local file database (not production-ready)
- Private key stored in environment variables
- No rate limiting beyond 24-hour cooldown

## Usage Examples

### Claim Daily Reward
```bash
curl -X POST http://localhost:3001/claim-daily-reward \
  -H "Content-Type: application/json" \
  -d '{"address": "0x1234567890123456789012345678901234567890"}'
```

### Check Reward Status
```bash
curl http://localhost:3001/reward-status/0x1234567890123456789012345678901234567890
```

### View System Stats
```bash
curl http://localhost:3001/rewards-stats
```

## Integration with PokiWars Client

The client can integrate with this system by:

1. **Checking reward availability** on game start
2. **Automatically claiming** daily rewards when eligible
3. **Showing countdown** for next available reward
4. **Displaying transaction confirmations** on successful claims

The x402 protocol responses provide all necessary timing and status information for a smooth user experience.

## Token Contract Details

- **Network**: Polygon Mainnet
- **Contract**: `0x80e044c711a6904950ff6cbb8f3bdb18877be483`
- **Token**: PKT (PokiToken)
- **Daily Amount**: 10 PKT
- **Decimals**: 18

## Future Enhancements

1. **Database Migration**: Move to PostgreSQL/MongoDB for production
2. **Authentication**: Add wallet signature verification
3. **Rate Limiting**: Implement additional anti-abuse measures
4. **Reward Scaling**: Dynamic rewards based on game activity
5. **Premium Features**: Standard x402 paid features alongside free rewards
