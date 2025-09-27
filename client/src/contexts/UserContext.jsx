import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { ethers } from 'ethers'
import tokenABI from '@/consts/tokenabi.json'

const POKI_TOKEN_ADDRESS = '0x5b2df7670561258b41339d464fa277396102802a';

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
      const provider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology")
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

  // Check for existing user session on mount
  useEffect(() => {
    async function checkUserSession() {
      try {
        if (window.ethereum && window.ethereum.isMetaMask) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            const address = accounts[0]
            setWalletAddress(address)
            
            // Fetch user data from Supabase
            const { data, error } = await supabase
              .from('users')
              .select('name')
              .eq('wallet_address', address)
              .single()

            if (data && !error) {
              setUsername(data.name)
            }
            
            // Fetch token balance for the connected wallet
            fetchTokenBalance(address)
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserSession()
  }, [])

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setUsername('')
          setWalletAddress('')
        } else {
          // User switched accounts
          const newAddress = accounts[0]
          setWalletAddress(newAddress)
          // Fetch token balance for the new account
          fetchTokenBalance(newAddress)
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
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

  const value = {
    username,
    walletAddress,
    isLoading,
    tokenBalance,
    balanceError,
    updateUsername,
    updateWalletAddress,
    clearUser,
    fetchTokenBalance
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
