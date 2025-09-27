import React, { useEffect, useState } from 'react'
import PixelBlast from '@/components/PixelBlast'
import { Button } from '@/components/ui/8bit/button'
import { connectWalletManually } from '@/lib/connectWallet'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'
import { tokenApi } from '@/lib/api/tokenApi'

function LandingPage() {
  const navigate = useNavigate()
  const { username, updateUsername, updateWalletAddress, walletAddress } = useUser()
  const [btnText, setBtnText] = useState('GET STARTED')
  const [showUsernamePopup, setShowUsernamePopup] = useState(false)
  const [localUsername, setLocalUsername] = useState('')
  const [connectedAccount, setConnectedAccount] = useState(null)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  // Handle the initial "Get Started" click
  const handleGetStarted = async () => {
    try {
      // First connect the wallet using manual connection
      const result = await connectWalletManually(updateWalletAddress, updateUsername)
      if (!result.success) {
        alert('Failed to connect wallet: ' + result.error)
        return
      }
      setConnectedAccount(result.account)

      // Check if user exists in Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', result.account)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase query error:', error)
        alert('Error checking user: ' + error.message)
        return
      }

      if (data) {
        // User exists, redirect to dashboard
        updateUsername(data.name)
        navigate('/dashboard')
        return
      }

      // User doesn't exist, show username popup
      setShowUsernamePopup(true)
    } catch (err) {
      console.error('Wallet connection error:', err)
      alert('Failed to connect wallet. Please try again.')
    }
  }

  // Handle username submission
  const handleUsernameSubmit = async () => {
    if (!localUsername.trim()) {
      alert('Please enter a username')
      return
    }

    if (!connectedAccount) {
      alert('Wallet not connected. Please try again.')
      return
    }

    setIsCreatingAccount(true)

    try {
      // Insert new user into Supabase
      const { error: insertError } = await supabase
        .from('users')
        .insert([{ wallet_address: connectedAccount, name: localUsername.trim() }])

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        alert('Could not save user: ' + insertError.message)
        setIsCreatingAccount(false)
        return
      }

      // Request tokens for new user
      console.log('🎉 New user created! Requesting 500 PKT tokens...')
      try {
        const tokenResult = await tokenApi.transferTokens(connectedAccount)
        if (tokenResult.success) {
          console.log('✅ Tokens transferred successfully for new user')
        } else {
          console.warn('⚠️ Token transfer failed for new user:', tokenResult.error)
          // Don't block the flow if token transfer fails
        }
      } catch (tokenError) {
        console.warn('⚠️ Token transfer error for new user:', tokenError)
        // Don't block the flow if token transfer fails
      }

      // Update context with new username
      updateUsername(localUsername.trim())
      setShowUsernamePopup(false)
      navigate('/dashboard')
    } catch (err) {
      console.error('Error creating user:', err)
      alert('Failed to create user. Please try again.')
    } finally {
      setIsCreatingAccount(false)
    }
  }

  // Handle popup close
  const handlePopupClose = () => {
    setShowUsernamePopup(false)
    setLocalUsername('')
    setConnectedAccount(null)
  }

  // Check if user is already connected (manual check only)
  useEffect(() => {
    if (walletAddress) {
      setBtnText('Go to Dashboard')
    } else {
      setBtnText('GET STARTED')
    }
  }, [walletAddress])

  // Handle existing wallet connection
  const handleExistingConnection = async () => {
    if (walletAddress) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="bg-black h-screen relative">
      <style jsx>{`
        @keyframes neon-glow {
          0% { box-shadow: 0 0 5px #0f0, 0 0 10px #0f0, 0 0 20px #0f0; }
          100% { box-shadow: 0 0 10px #0f0, 0 0 20px #0f0, 0 0 30px #0f0, 0 0 40px #0f0; }
        }
        .glow-button {
          animation: neon-glow 1.5s ease-in-out infinite alternate;
          border: 2px solid #0f0;
        }
        .popup-overlay {
          background-color: rgba(0, 0, 0, 0.8);
        }
        .popup-container {
          background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
          border: 2px solid #0f0;
          box-shadow: 0 0 20px #0f0, inset 0 0 10px rgba(0, 255, 0, 0.1);
        }
        .username-input {
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid #0f0;
          color: white;
          transition: all 0.3s ease;
        }
        .username-input:focus {
          outline: none;
          border-color: #0f0;
          box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
      `}</style>

      <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
        <PixelBlast
          variant="square"
          pixelSize={6}
          color="#06cf02"
          patternScale={3}
          patternDensity={1.2}
          pixelSizeJitter={0.5}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.6}
          edgeFade={0.25}
          transparent={true}
        />

        <div className="absolute inset-0 flex gap-80 items-center justify-center z-10 pointer-events-none">
          <div className="font-pixelify pointer-events-none absolute m-5 top-4 left-4 text-lime-100 text-6xl">
            POKIWARS
          </div>

          <div className="font-pixelify text-white text-6xl pointer-events-auto flex items-center justify-center flex-col">
            <div className="bg-white/0 p-10 rounded-2xl mb-8">
              <div>Aim. Stake. Conquer.</div>
            </div>

            <div className="absolute right-20 bottom-20">
              <Button
                onClick={btnText === 'GET STARTED' ? handleGetStarted : handleExistingConnection}
                className="text-black px-4 py-6 glow-button relative"
                variant="outline"
              >
                <span className="text-2xl font-extrabold font-pixelify">
                  {btnText}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Username Popup */}
      {showUsernamePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center popup-overlay">
          <div className="popup-container p-8 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <h2 className="font-pixelify text-2xl text-lime-400 mb-6">
                Choose Your Username
              </h2>
              
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={localUsername}
                  onChange={(e) => setLocalUsername(e.target.value)}
                  className="username-input w-full p-3 rounded font-pixelify text-lg"
                  maxLength={20}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleUsernameSubmit()
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleUsernameSubmit}
                  className="text-black px-6 py-2"
                  variant="outline"
                  disabled={!localUsername.trim() || isCreatingAccount}
                >
                  <span className="font-pixelify font-bold">
                    {isCreatingAccount ? 'Creating Account...' : 'OK'}
                  </span>
                </Button>
                
                <Button
                  onClick={handlePopupClose}
                  className="text-black px-6 py-2 bg-red-400"
                  variant="outline"
                >
                  <span className="font-pixelify font-bold">Cancel</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LandingPage