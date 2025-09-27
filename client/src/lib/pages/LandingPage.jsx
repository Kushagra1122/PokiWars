import React, { useEffect, useState } from 'react'
import PixelBlast from '@/components/PixelBlast'
import { Button } from '@/components/ui/8bit/button'
import connectWallet from '@/lib/connectWallet'
import { supabase } from '@/lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@/contexts/UserContext'

function LandingPage() {
  const navigate = useNavigate()
  const { username, updateUsername, updateWalletAddress, walletAddress } = useUser()
  const [btnText, setBtnText] = useState('GET STARTED')

  // Save walletAddress and username to localStorage whenever they change
  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('walletAddress', walletAddress)
    } else {
      localStorage.removeItem('walletAddress')
    }
  }, [walletAddress])

  useEffect(() => {
    if (username) {
      localStorage.setItem('username', username)
    } else {
      localStorage.removeItem('username')
    }
  }, [username])
  const [localUsername, setLocalUsername] = useState('')

  const handleConnect = async () => {
    try {
      const connectedAccount = await connectWallet()
      updateWalletAddress(connectedAccount)

      // Store immediately after connecting
      localStorage.setItem('walletAddress', connectedAccount)

      // Check if user exists in Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', connectedAccount)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase query error:', error)
        alert('Error checking user: ' + error.message)
        return
      }

      if (data) {
        // User exists → navigate directly to dashboard
        localStorage.setItem('username', data.name || "")
        setUsername(data.name || "")
        navigate('/dashboard')
        return
      }

      // User does not exist → save new user
      if (localUsername.trim() === '') {
        alert('Please enter a username')
        return
      }

      const { error: insertError } = await supabase
        .from('users')
        .insert([{ wallet_address: connectedAccount, name: localUsername }])

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        alert('Could not save user: ' + insertError.message)
        return
      }

      localStorage.setItem('username', username)
      // Update context with new username
      updateUsername(localUsername)
      navigate('/first')
    } catch (err) {
      console.error('Wallet connection error:', err)
    }
  }

  useEffect(() => {
    async function checkWalletConnection() {
      if (window.ethereum && window.ethereum.isMetaMask) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length === 0) {
            setBtnText('Connect Wallet')
            setWalletAddress('')
            localStorage.removeItem('walletAddress')
          } else {
            setBtnText('Go to Dashboard')
            updateWalletAddress(accounts[0])
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err)
          navigate('/')
        }
      } else {
        navigate('/') // MetaMask not installed
      }
    }
    checkWalletConnection()
  }, [navigate, updateWalletAddress])

  const unlinkWallet = () => {
    setWalletAddress('')
    setUsername('')
    localStorage.removeItem('walletAddress')
    localStorage.removeItem('username')
    setBtnText('Connect Wallet')
    // Optionally redirect user or refresh UI as needed
  }

  return (
    <div className="bg-black h-screen">
      <style jsx>{`
        @keyframes neon-glow {
          0% { box-shadow: 0 0 5px #0f0, 0 0 10px #0f0, 0 0 20px #0f0; }
          100% { box-shadow: 0 0 10px #0f0, 0 0 20px #0f0, 0 0 30px #0f0, 0 0 40px #0f0; }
        }
        .glow-button {
          animation: neon-glow 1.5s ease-in-out infinite alternate;
          border: 2px solid #0f0;
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


            {/* Username input */}
            <input
              type="text"
              placeholder="Enter username"
              value={localUsername}
              onChange={(e) => setLocalUsername(e.target.value)}
              className="mb-6 p-2 text-white rounded"
            />


            <div className="absolute right-20 bottom-20">
              <Button
                onClick={handleConnect}
                className="text-black w-[200px] h-[60px] glow-button relative"
                variant="outline"
              >
                <span className="text-2xl font-extrabold font-pixelify">
                  {btnText}
                </span>
              </Button>
              {/* Show Unlink Wallet button only if wallet is connected */}
              {walletAddress && (
                <button
                  onClick={unlinkWallet}
                  className="text-black w-[200px] h-[60px] glow-button relative"
                >
                  <span className="text-2xl font-extrabold font-pixelify">
                    Disconnect Wallet
                  </span>

                </button>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default LandingPage
