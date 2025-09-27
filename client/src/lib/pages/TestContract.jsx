import React, { useState } from 'react';
import { ethers } from 'ethers';

// ABI for sayHelloWorld function
const helloWorldABI = [
  {
    inputs: [],
    name: "sayHelloWorld",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "pure",
    type: "function"
  }
];

const contractAddress = "0x918f525a7eb15ae45809cd7dc67e22139f2111f9";

export default function TestContract() {
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Connect wallet and get signer
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setError('');
    } catch (err) {
      setError('User denied wallet connection');
    }
  };

  // Call sayHelloWorld
  const callHelloWorld = async () => {
    if (!window.ethereum) {
      setError('MetaMask not detected');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, helloWorldABI, signer);
      const result = await contract.sayHelloWorld();
      setMessage(result);
    } catch (err) {
      setError('Failed to call contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>HelloWorld Contract</h2>
      {!account ? (
        <button onClick={connectMetaMask}>Connect MetaMask</button>
      ) : (
        <p>Connected: {account.substring(0,6)}...{account.substring(account.length - 4)}</p>
      )}
      <button onClick={callHelloWorld} disabled={loading}>
        {loading ? 'Loading...' : 'Say Hello World'}
      </button>
      {message && <p>Contract says: {message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
