import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import tokenABI from '../consts/tokenabi.json';  // Import ABI JSON

const POKI_TOKEN_ADDRESS = '0x5b2df7670561258b41339d464fa277396102802a';

export default function TokenBalance({ walletAddress }) {
    const [balance, setBalance] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchBalance() {
            setError(null);
            setBalance(null);



            if (!walletAddress || !ethers.utils.isAddress(walletAddress)) {
                setError('Invalid wallet address');
                return;
            }

            try {
                const provider = new ethers.providers.JsonRpcProvider("https://rpc-amoy.polygon.technology");

                const network = await provider.getNetwork();
                console.log(network);
                const blockNumber = await provider.getBlockNumber();
                console.log("Block number:", blockNumber);

                // Now this points to your custom testnet RPC
                const code = await provider.getCode('0x5b2df7670561258b41339d464fa277396102802a');
                console.log(code);
                if (code === '0x') {
                    setError('Contract not deployed at the specified address on the connected network');
                    return;
                }


                const contract = new ethers.Contract(POKI_TOKEN_ADDRESS, tokenABI, provider);

                const rawBalance = await contract.balanceOf(walletAddress);

                // Try to get decimals, fallback to 18 if not available
                let decimals = 18;
                try {
                    decimals = await contract.decimals();
                } catch (decErr) {
                    console.warn('Error fetching decimals, defaulting to 18');
                }

                const formattedBalance = ethers.utils.formatUnits(rawBalance, decimals);
                setBalance(formattedBalance);
            } catch (err) {
                setError(`Failed to fetch token balance: ${err.message || err}`);
                console.error(err);
            }
        }

        fetchBalance();
    }, [walletAddress]);

    if (error) return <p style={{ color: 'red' }}>{error}</p>;
    if (!walletAddress) return <p>No wallet address provided.</p>;
    return (
        <div>
            <p><strong>Wallet:</strong> {walletAddress}</p>
            <p><strong>PokiToken Balance:</strong> {balance !== null ? balance : 'Loading...'}</p>
        </div>
    );
}
