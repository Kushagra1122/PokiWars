# Velocity Boost System with x402 Micropayments

A real-time velocity boost system that allows players to purchase 1.4x speed multipliers during battle using x402 micropayments on Polygon.

## Overview

This system implements:
- **x402 Micropayment Protocol**: HTTP 402 responses for pay-per-use boosts
- **Real-time Speed Boosts**: 1.4x velocity multiplier for 30 seconds
- **Polygon Integration**: 10 PKT token payments for each boost
- **Battle Integration**: Seamless in-game boost activation
- **Live UI Updates**: Real-time boost status and countdown timers

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Game Client   │    │   Game Server   │    │  Polygon Chain  │
│                 │    │                 │    │                 │
│  1. Click Boost │───▶│  2. Return 402  │    │                 │
│     Card        │    │     Payment Req │    │                 │
│                 │    │                 │    │                 │
│  3. User Pays   │───▶│  4. Validate    │───▶│  Verify Payment │
│     10 PKT      │    │     Payment     │    │                 │
│                 │    │                 │    │                 │
│  5. Boost       │◀───│  6. Activate    │◀───│  Payment Valid  │
│     Activated   │    │     1.4x Speed  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## x402 Micropayment Flow

### Step 1: Boost Request (No Payment)
```http
POST /use-boost
Content-Type: application/json

{
  "playerId": "player_123",
  "userAddress": "0x..."
}
```

**Response (402 Payment Required):**
```json
{
  "success": false,
  "error": "Payment required for velocity boost",
  "code": "PAYMENT_REQUIRED",
  "x402": {
    "type": "boost_payment_required",
    "message": "To use the velocity boost during battle, please authorize a micro-payment of 10 PKT tokens on Polygon. This unlocks 1.4x faster movement for your character and enhances gameplay for 30 seconds. Press confirm in your wallet to pay and activate the boost instantly.",
    "paymentRequest": {
      "paymentId": "boost_1234567890_abc123",
      "amount": "10",
      "token": "PKT",
      "contract": "0x80e044c711a6904950ff6cbb8f3bdb18877be483",
      "network": "polygon",
      "recipient": "BACKEND_WALLET",
      "description": "Velocity Boost - 1.4x speed for 30 seconds"
    },
    "boostDetails": {
      "effect": "1.4x velocity multiplier",
      "duration": "30 seconds",
      "cost": "10 PKT tokens"
    }
  }
}
```

### Step 2: Boost Request (With Payment)
```http
POST /use-boost
Content-Type: application/json
X-Payment-Id: boost_1234567890_abc123
X-Transaction-Hash: 0x...

{
  "playerId": "player_123",
  "userAddress": "0x..."
}
```

**Response (200 Success):**
```json
{
  "success": true,
  "message": "Velocity boost activated successfully!",
  "x402": {
    "type": "boost_activated",
    "paymentType": "micropayment",
    "amount": "10 PKT",
    "network": "polygon",
    "transactionHash": "0x...",
    "boostEffect": "1.4x velocity for 30 seconds"
  },
  "boost": {
    "playerId": "player_123",
    "multiplier": 1.4,
    "duration": 30000,
    "endTime": 1640995200000,
    "remainingTime": 30000,
    "transactionHash": "0x..."
  },
  "payment": {
    "paymentId": "boost_1234567890_abc123",
    "amount": "10",
    "transactionHash": "0x...",
    "blockNumber": 12345
  }
}
```

## API Endpoints

### 1. Use Boost (x402 Micropayment)
- **Endpoint**: `POST /use-boost`
- **Purpose**: Purchase and activate velocity boost
- **Flow**: Returns 402 → User pays → Returns 200 with boost activation

### 2. Boost Status
- **Endpoint**: `GET /boost-status/{playerId}`
- **Purpose**: Check if player has active boost
- **Response**: Current boost status and remaining time

### 3. Boost Statistics
- **Endpoint**: `GET /boost-stats`
- **Purpose**: System-wide boost usage statistics
- **Response**: Revenue, active boosts, total purchases

### 4. Boost Information
- **Endpoint**: `GET /boost-info`
- **Purpose**: x402 protocol and boost details
- **Response**: Protocol info, costs, effects

## Frontend Integration

### Game Component Integration
The velocity boost system is integrated into the battle gameplay:

1. **VelocityBoostCard**: React component overlay on game screen
2. **MainGameScene**: Phaser scene with speed multiplier logic
3. **Effects**: Visual boost activation effects
4. **SocketManager**: Real-time boost synchronization

### UI Features

**Boost Card Display:**
- 💜 Purple-themed card matching battle UI
- ⚡ Shows boost cost (10 PKT) and effect (1.4x speed)
- 🕒 Live countdown timer during active boost
- 💳 Payment prompt with x402 messaging

**In-Game Integration:**
- 🚀 Real-time speed multiplier application
- ✨ Visual boost activation effects
- 📊 Boost status display in top-right corner
- ⏰ Automatic boost expiration handling

## Payment User Experience

When a player clicks the boost card:

1. **Initial Request**: Sent without payment headers
2. **402 Response**: Server returns payment requirement
3. **Payment Prompt**: User sees friendly payment dialog:
   ```
   To use the velocity boost during battle, please authorize a 
   micro-payment of 10 PKT tokens on Polygon.
   
   This unlocks 1.4x faster movement for your character and 
   enhances gameplay for 30 seconds.
   
   Cost: 10 PKT tokens
   Effect: 1.4x velocity multiplier  
   Duration: 30 seconds
   
   Press confirm in your wallet to pay and activate the boost instantly.
   ```
4. **Payment Processing**: User confirms transaction in wallet
5. **Boost Activation**: Speed immediately increases in-game

## Database Schema

The boost system uses `server/data/boosts.json`:

```json
{
  "activeBoosts": {
    "player_123": {
      "playerId": "player_123",
      "userAddress": "0x...",
      "startTime": 1640995200000,
      "endTime": 1640995230000,
      "multiplier": 1.4,
      "paymentId": "boost_1234567890_abc123",
      "transactionHash": "0x...",
      "blockNumber": 12345
    }
  },
  "paymentHistory": {
    "boost_1234567890_abc123": {
      "paymentId": "boost_1234567890_abc123",
      "playerId": "player_123",
      "userAddress": "0x...",
      "amount": "10",
      "timestamp": 1640995200000,
      "transactionHash": "0x...",
      "blockNumber": 12345,
      "boostType": "velocity",
      "status": "completed"
    }
  },
  "metadata": {
    "created": 1640995200000,
    "lastUpdate": 1640995200000,
    "totalBoosts": 15,
    "totalRevenue": "150"
  }
}
```

## Game Integration Details

### Speed Multiplier Implementation
```javascript
// In MainGameScene.jsx
constructor() {
  this.baseMoveSpeed = 200;    // Original speed
  this.moveSpeed = 200;        // Current speed (affected by boosts)
  this.boostMultiplier = 1.0;  // Current multiplier
}

activateBoost(boostData) {
  this.boostMultiplier = 1.4;
  this.moveSpeed = this.baseMoveSpeed * this.boostMultiplier; // 280
  this.boostEndTime = this.time.now + 30000; // 30 seconds
}
```

### Real-time Updates
- **Socket Events**: Server emits boost activation to all players
- **Live Timer**: Countdown updates every second
- **Auto Expiration**: Boost automatically deactivates after 30 seconds
- **Visual Effects**: Spectacular activation animation

## Security & Validation

### Payment Validation
- ✅ **Transaction Hash Verification**: Checks Polygon blockchain
- ✅ **Amount Validation**: Ensures exactly 10 PKT paid
- ✅ **Contract Verification**: Validates payment to correct contract
- ✅ **Replay Protection**: Each payment ID used only once

### Game Security
- ✅ **Server-side Boost Tracking**: Prevents client manipulation
- ✅ **Automatic Cleanup**: Expired boosts removed from memory
- ✅ **Socket Synchronization**: All players see boost effects

## Testing

Test the boost system:

1. **Start Game**: Enter battle mode
2. **See Boost Card**: Purple card in top-right corner
3. **Click Boost**: Triggers x402 payment flow
4. **Confirm Payment**: 10 PKT transaction prompt
5. **Boost Activates**: Speed increases immediately
6. **Monitor Timer**: 30-second countdown begins
7. **Auto Expiration**: Speed returns to normal

## Revenue Model

- **Cost**: 10 PKT tokens per boost
- **Duration**: 30 seconds
- **Effect**: 1.4x velocity multiplier
- **Usage**: Pay-per-use during battles
- **Settlement**: Instant Polygon payments

## Future Enhancements

1. **Multiple Boost Types**: Attack boost, shield boost, etc.
2. **Stacking Boosts**: Multiple simultaneous effects
3. **Dynamic Pricing**: Cost based on game state
4. **Team Boosts**: Affect entire team for higher cost
5. **Boost Combos**: Discounted multi-boost packages

## x402 Protocol Compliance

✅ **HTTP 402 Responses**: Proper payment required messaging  
✅ **Payment Headers**: X-Payment-Id and X-Transaction-Hash  
✅ **Micropayment Flow**: Pay-per-use boost activation  
✅ **Real-time Settlement**: Immediate Polygon validation  
✅ **User Experience**: Clear payment prompts and confirmations  

The velocity boost system demonstrates the power of x402 micropayments for enhancing gameplay with instant, secure, and transparent transactions on Polygon.
