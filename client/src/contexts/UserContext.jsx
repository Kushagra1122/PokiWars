import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

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
          setWalletAddress(accounts[0])
          // You might want to fetch the new user's data here
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
  }

  const value = {
    username,
    walletAddress,
    isLoading,
    updateUsername,
    updateWalletAddress,
    clearUser
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}
