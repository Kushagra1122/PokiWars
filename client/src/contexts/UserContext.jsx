import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ethers } from 'ethers'
import tokenABI from '@/consts/tokenabi.json'

const POKI_TOKEN_ADDRESS = '0x80e044c711a6904950ff6cbb8f3bdb18877be483';

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [tokenBalance, setTokenBalance] = useState(null)
  const [balanceError, setBalanceError] = useState(null)

  // Function to fetch token balance
  const fetchTokenBalance = async (address) => {
    setBalanceError(null)
    setTokenBalance(null)

    if (!address || !ethers.utils.isAddress(address)) {
      setBalanceError('Invalid wallet address')
      return
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com/")
      const contract = new ethers.Contract(POKI_TOKEN_ADDRESS, tokenABI, provider)

      const rawBalance = await contract.balanceOf(address)

      // Try to get decimals, fallback to 18 if not available
      let decimals = 18
      try {
        decimals = await contract.decimals()
      } catch (decErr) {
        console.warn('Error fetching decimals, defaulting to 18')
      }

      const formattedBalance = ethers.utils.formatUnits(rawBalance, decimals)
      setTokenBalance(formattedBalance)
    } catch (err) {
      setBalanceError(`Failed to fetch token balance: ${err.message || err}`)
      console.error('Token balance error:', err)
    }
  }

  // Check for existing user session on mount - DISABLED for manual control
  useEffect(() => {
    // Auto wallet detection disabled - user must manually connect
    setIsLoading(false)
  }, [])

  // Listen for account changes - DISABLED for manual control
  useEffect(() => {
    // Auto account change detection disabled - user must manually connect/disconnect
    // This prevents automatic reconnection when user switches accounts in MetaMask
  }, [])

  const updateUsername = (newUsername) => {
    setUsername(newUsername)
  }

  const updateWalletAddress = (address) => {
    setWalletAddress(address)
  }

  const clearUser = () => {
    setUsername('')
    setWalletAddress('')
    setTokenBalance(null)
    setBalanceError(null)
  }

  // Complete wallet unlinking function
  const unlinkWallet = async () => {
    try {
      // Clear all user data from context
      clearUser()
      
      // Clear any stored data in localStorage
      localStorage.removeItem('userData')
      localStorage.removeItem('walletAddress')
      localStorage.removeItem('username')
      
      // If MetaMask is available, try to disconnect
      if (window.ethereum && window.ethereum.isMetaMask) {
        try {
          // Try to disconnect using the new disconnect method (if available)
          if (window.ethereum.disconnect) {
            await window.ethereum.disconnect()
          }
          
          // Also try the legacy method
          if (window.ethereum.close) {
            await window.ethereum.close()
          }
        } catch (disconnectError) {
          console.log('MetaMask disconnect not supported or failed:', disconnectError)
          // This is normal - MetaMask doesn't always support programmatic disconnection
        }
      }
      
      console.log('Wallet unlinked successfully')
      return { success: true, message: 'Wallet unlinked successfully' }
    } catch (error) {
      console.error('Error unlinking wallet:', error)
      return { success: false, message: 'Error unlinking wallet' }
    }
  }

  const value = {
    username,
    walletAddress,
    isLoading,
    tokenBalance,
    balanceError,
    updateUsername,
    updateWalletAddress,
    clearUser,
    unlinkWallet,
    fetchTokenBalance
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
