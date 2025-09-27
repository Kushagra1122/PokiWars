# UserContext

A global React context for managing user data across the application.

## Features

- **Username Management**: Store and update username globally
- **Wallet Address**: Track connected wallet address
- **Auto-sync with Supabase**: Automatically fetches user data on app load
- **Account Change Detection**: Listens for MetaMask account changes
- **Loading States**: Provides loading state for async operations

## Usage

### 1. Import the hook
```jsx
import { useUser } from '@/contexts/UserContext'
```

### 2. Use in any component
```jsx
function MyComponent() {
  const { username, walletAddress, isLoading, updateUsername, clearUser } = useUser()
  
  return (
    <div>
      <p>Welcome, {username}!</p>
      <p>Wallet: {walletAddress}</p>
    </div>
  )
}
```

## Available Properties

- `username`: Current username (string)
- `walletAddress`: Connected wallet address (string)
- `isLoading`: Loading state for initial data fetch (boolean)

## Available Methods

- `updateUsername(newUsername)`: Update the username
- `updateWalletAddress(address)`: Update wallet address
- `clearUser()`: Clear all user data

## Context Provider

The `UserProvider` is already set up in `App.jsx` and wraps the entire application, so you can use the `useUser` hook in any component within the app.

## Auto-sync Features

- Automatically checks for existing wallet connection on app load
- Fetches user data from Supabase if wallet is connected
- Listens for MetaMask account changes
- Updates context when user switches accounts
