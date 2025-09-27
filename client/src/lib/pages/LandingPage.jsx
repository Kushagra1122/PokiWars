import React, { useEffect, useState } from 'react'
import PixelBlast from '@/components/PixelBlast'
import { Button } from '@/components/ui/8bit/button' // Assuming this is your custom 8bit button
import connectWallet from '@/lib/connectWallet'
import { useNavigate } from 'react-router-dom';
function LandingPage() {
    const navigate = useNavigate();
    const [btnText, setBtnText] = useState("GET STARTED");
    const handleClick = () => {
        console.log("jidhwihxo")
        var { provider, connectedAccount } = connectWallet();
        if (!provider && !connectedAccount) {
            // Navigate to dashboard when wallet is not connected
            window.location.href = '/dashboard';
        }
        // handle wallet connect
    }

    // Check MetaMask connection on mount
    useEffect(() => {
        async function checkWalletConnection() {
            if (window.ethereum && window.ethereum.isMetaMask) {
                try {
                    const accounts = await window.ethereum.requesapt({ method: 'eth_accounts' });
                    if (accounts.length === 0) {
                        setBtnText('Connect Wallet');
                    } else {
                        setBtnText('Go to Dashboard');
                        setWalletAddress(accounts[0]);
                    }
                } catch (err) {
                    console.error('Error checking wallet connection:', err);
                    navigate('/');
                }
            } else {
                navigate('/'); // MetaMask not installed
            }
        }
        checkWalletConnection();
    }, [navigate]);

    return (
        <div className='bg-black h-screen'>
            <style jsx>{`
        @keyframes neon-glow {
            0% {
                box-shadow: 0 0 5px #0f0, 0 0 10px #0f0, 0 0 20px #0f0; /* Subtle green glow */
            }
            100% {
                box-shadow: 0 0 10px #0f0, 0 0 20px #0f0, 0 0 30px #0f0, 0 0 40px #0f0; /* Brighter glow */
            }
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
                    <div className=' font-pixelify pointer-events-none absolute m-5 top-4 left-4 text-lime-100 text-6xl'>POKIWARS</div>
                    <div className="font-pixelify text-white text-6xl pointer-events-auto flex items-center justify-center flex-col"> {/* Added flex-col here for better alignment */}
                        <div className='bg-white/0 p-10 rounded-2xl mb-8'> {/* Added margin-bottom */}
                            <div>Aim. Stake. Conquer.</div>
                        </div>
                        {/* SIGN UP NOW Button with glow effect */}
                        <div className='absolute right-20 bottom-20'>
                            <Button
                                onClick={() => handleClick()}
                                className='text-black w-[200px] h-[60px] glow-button relative  ' // Apply the glow-button class here
                                variant="outline"
                            >
                                <span className='text-2xl font-extrabold font-pixelify'>
                                    {btnText}
                                </span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage