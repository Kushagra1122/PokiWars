import TokenBalance from '@/components/BalanceTokens';
import { Bell, User, Users } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/8bit/drawer"
import { Button } from '@/components/ui/8bit/button';
import PokemonCard from '@/components/PokimonCard';

function Dashboard() {
    const navigate = useNavigate();

    const [hoveredNav, setHoveredNav] = useState(null);
    
    //update this state addd.
    const [main, setMain] = useState({ name: "Venusaur", type: "Grass", attack: 85, range: 4, exp: 30, level: 16, img:'./venu-thumbnail.png', main:'./venu.png' })
    
    
    const [walletAddress, setWalletAddress] = useState(null);
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);


    // Check MetaMask connection on mount
    useEffect(() => {
        async function checkWalletConnection() {
            if (window.ethereum && window.ethereum.isMetaMask) {
                try {
                    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length === 0) {
                        navigate('/'); // Not connected, redirect
                    } else {
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

    const handleMarketplaceClick = () => {
        console.log('Navigate to Marketplace');
        // Add your navigation logic here
    };

    const handleBattleClick = () => {
        console.log('Start Battle');
        // Add your battle logic here
    };

    const handleSwapClick = () => {
        console.log('Open Swap Screen');

    };

    // Show/hide profile dropdown on profile icon click
    const handleProfileClick = () => {
        setShowProfileDropdown(prev => !prev);
    };
    const handleMyProfileClick = () => {
        navigate('/profile');
        setShowProfileDropdown(false);
    };

    const handleNotificationsClick = () => {
        console.log('Open Notifications');
        // Add your notifications logic here
    };

    const handleUsersClick = () => {
        console.log('Open Users/Friends');
        // Add your users logic here
    };

    //TODO: replace with original
    const samplePokemon = [
        { name: "Pikachu", type: "Electric", attack: 75, range: 4, exp: 85, level: 12, img:'./venu-thumbnail.png', main:'./venu.png' },
        { name: "Charizard", type: "Fire", attack: 95, range: 5, exp: 45, level: 18, img:'./blastoise-thumbnail.png', main:'./blast.png' },
        { name: "Blastoise", type: "Water", attack: 80, range: 3, exp: 90, level: 15, img:'./chariz-thumbnail.png', main:'./chariz.png' },
        { name: "Venusaur", type: "Grass", attack: 85, range: 4, exp: 30, level: 16, img:'./venu-thumbnail.png', main:'./venu.png' },
        { name: "Alakazam", type: "Psychic", attack: 70, range: 6, exp: 65, level: 20, img:'./blastoise-thumbnail.png', main:'./blast.png' },
        { name: "Machamp", type: "Fighting", attack: 100, range: 2, exp: 10, level: 14, img:'./chariz-thumbnail.png', main:'./chariz.png' }
      ];

    
    //Todo: change this accordinglyy 
    const pokemonSelect = (pokemon) => {
        setMain(pokemon)
    }
    return (
        <div className="bg-black h-screen w-full flex justify-center overflow-hidden">
            <div className="absolute  top-0 left-0 w-full h-full ">
                <img
                    src="./dashboard_bg.png"
                    alt="bg-img"
                    className="w-full h-full object-cover"
                />
            </div>

            <div className=' font-pixelify pointer-events-none absolute m-5 top-4 left-4 text-lime-100 text-6xl'>POKIWARS</div>

            {/* Custom CSS for animations and glows */}
            <style jsx>{`
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-20px);
                    }
                }
                
                .bounce-animation {
                    animation: bounce 2s ease-in-out infinite;
                }
                
                .glow-button {
                    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
                    transition: all 0.3s ease;
                }
                
                .glow-button:hover {
                    box-shadow: 0 0 30px rgba(255, 255, 255, 0.6);
                    transform: scale(1.05);
                }
                
                .tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 14px;
                    white-space: nowrap;
                    z-index: 1000;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: all 0.3s ease;
                    pointer-events: none;
                }
                
                .tooltip.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                
                .nav-button {
                    transition: all 0.3s ease;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                }
                
                .nav-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.1);
                }
            `}</style>

            {/* Navbar */}
            <div className="flex justify-center items-center absolute right-0 m-6 gap-6 border-2 border-white/50 max-w-2xl h-20 px-6 bg-white/30 backdrop-blur-sm rounded-lg">
                <div
                    className="relative nav-button"
                    onMouseEnter={() => setHoveredNav('profile')}
                    onMouseLeave={() => setHoveredNav(null)}
                    onClick={handleProfileClick}
                >
                    <User className='font-extrabold size-11 text-white' />
                    <div className={`tooltip ${hoveredNav === 'profile' ? 'show' : ''}`} style={{ top: '70px', left: '50%', transform: 'translateX(-50%)' }}>
                        Profile
                    </div>
                    {showProfileDropdown && (
                        <div className="absolute top-full mt-2 right-0 w-56 bg-black bg-opacity-90 border border-white/50 rounded-lg p-4 text-white z-20">
                            <p className="break-words mb-2"><strong>Wallet:</strong> {walletAddress}</p>
                            <button
                                onClick={handleMyProfileClick}
                                className="w-full px-2 py-1 bg-lime-600 hover:bg-lime-700 rounded"
                            >
                                My Profile
                            </button>
                            <TokenBalance walletAddress={walletAddress} />
                        </div>
                    )}
                </div>

                <div
                    className="relative nav-button"
                    onMouseEnter={() => setHoveredNav('notifications')}
                    onMouseLeave={() => setHoveredNav(null)}
                    onClick={handleNotificationsClick}
                >
                    <Bell className='font-extrabold size-11 text-white' />
                    <div className={`tooltip ${hoveredNav === 'notifications' ? 'show' : ''}`} style={{ top: '70px', left: '50%', transform: 'translateX(-50%)' }}>
                        Notifications
                    </div>
                </div>

                <div
                    className="relative nav-button"
                    onMouseEnter={() => setHoveredNav('friends')}
                    onMouseLeave={() => setHoveredNav(null)}
                    onClick={handleUsersClick}
                >
                    <Users className='text-white size-11' />
                    <div className={`tooltip ${hoveredNav === 'friends' ? 'show' : ''}`} style={{ top: '70px', left: '50%', transform: 'translateX(-50%)' }}>
                        Friends
                    </div>
                </div>
            </div>

            {/* Bottom buttons with glow effects */}
            <button
                onClick={handleMarketplaceClick}
                className='glow-button m-6 flex justify-center items-center text-4xl font-pixelify border-2 border-white/70 absolute left-0 bottom-0 h-40 w-80 text-white bg-black/50 backdrop-blur-sm rounded-lg cursor-pointer'
            >
                GO TO MARKETPLACE
            </button>

            <button
                onClick={handleBattleClick}
                className=' glow-button m-6 flex justify-center items-center text-6xl font-pixelify border-2 border-white/70 absolute right-0 bottom-0 h-40 w-80 text-white bg-black/50 backdrop-blur-sm rounded-lg cursor-pointer'
            >
                Battle
            </button>

            {/* Bouncing character */}
            <div className='max-h-96 z-10 bounce-animation mt-22 flex items-center justify-center'>
                <img src={main.main} alt="Character" className="max-w-md max-h-96 object-contain" />
            </div>


            <Drawer>
                <DrawerTrigger className="font-pixelify glow-button px-8 py-4 m-4 text-white text-4xl  border-2 border-white/70 absolute bottom-0 bg-black/50 backdrop-blur-sm rounded-lg cursor-pointer">
                    Swap
                </DrawerTrigger>

                <DrawerContent className="h-110">
                    <DrawerHeader>
                        <DrawerTitle className="text-2xl">SELECT YOUR MAIN.</DrawerTitle>
                        <DrawerDescription>You'll take this Pokimon to battle</DrawerDescription>
                    </DrawerHeader>

                    <div className='flex justify-center items-center gap-10 h-70 left-4 top-30 w-full absolute'>
                        <div className="flex justify-center gap-2 items-center gap flex-wrap">
                            {samplePokemon.map((pokemon, index) => (
                            <PokemonCard
                                imageSrc={pokemon.img}
                                key={index}
                                name={pokemon.name}
                                type={pokemon.type}
                                attack={pokemon.attack}
                                range={pokemon.range}
                                exp={pokemon.exp}
                                level={pokemon.level}
                                onClick={()=>pokemonSelect(pokemon)}
                            />
                            ))}
                        </div>
                    </div>


                    {/* <DrawerFooter className="flex justify-centre items-end">
                        <Button className="max-w-30 ">LET'S GO</Button>
                    </DrawerFooter> */}
                        <DrawerClose className="absolute m-4 top-0 right-0">
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                </DrawerContent>
            </Drawer>
        </div>
    )
}

export default Dashboard