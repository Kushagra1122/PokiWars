import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "./ui/button";
import useContracts from "../useContracts";

export default function ShopDialog({ open, onClose }) {
  const { marketplace, nft, token, account } = useContracts();
  const [loading, setLoading] = useState(false);
  const [sellTokenId, setSellTokenId] = useState("");
  const [delistTokenId, setDelistTokenId] = useState("");
  const [ownedNFTs, setOwnedNFTs] = useState([]);
  const [listedNFTs, setListedNFTs] = useState([]);
  const [erc20Approved, setErc20Approved] = useState(false);
  const [erc721Approved, setErc721Approved] = useState(false);

  // ✅ Fetch NFTs
  useEffect(() => {
    if (!open || !account || !nft || !marketplace) return;

    const fetchNFTs = async () => {
      try {
        const owned = [];
        for (let i = 1; i <= 10; i++) {
          const owner = await nft.ownerOf(i);
          if (owner.toLowerCase() === account.toLowerCase()) owned.push(i);
        }
        setOwnedNFTs(owned);

        const listings = await marketplace.getMyListings();
        setListedNFTs(listings.map((l) => l.tokenId.toString()));
      } catch (err) {
        console.error("Fetch NFTs failed:", err);
      }
    };

    fetchNFTs();
  }, [open, account, nft, marketplace]);

  // ✅ Check approvals
  useEffect(() => {
    if (!account || !token || !nft || !marketplace) return;

    const checkApprovals = async () => {
      try {
        const allowance = await token.allowance(account, marketplace.target);
        setErc20Approved(allowance.gt(0));

        const approved = await nft.isApprovedForAll(account, marketplace.target);
        setErc721Approved(approved);
      } catch (err) {
        console.error("Approval check failed:", err);
      }
    };

    checkApprovals();
  }, [account, token, nft, marketplace]);

  // ✅ Approve ERC20
  const handleApproveERC20 = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const tx = await token.approve(marketplace.target, ethers.constants.MaxUint256);
      await tx.wait();
      setErc20Approved(true);
    } catch (err) {
      console.error(err);
      alert("ERC20 approve failed");
    }
    setLoading(false);
  };

  // ✅ Approve ERC721
  const handleApproveERC721 = async () => {
    if (!nft) return;
    setLoading(true);
    try {
      const tx = await nft.setApprovalForAll(marketplace.target, true);
      await tx.wait();
      setErc721Approved(true);
    } catch (err) {
      console.error(err);
      alert("ERC721 approve failed");
    }
    setLoading(false);
  };

  // ✅ Buy NFT
  const handleBuy = async (tokenId) => {
    if (!erc20Approved || !marketplace || !account) {
      alert("Approve ERC20 first");
      return;
    }
    if (ownedNFTs.includes(Number(tokenId))) return alert("Already owned");

    setLoading(true);
    try {
      const tx = await marketplace.buyNFT(nft.target, tokenId);
      await tx.wait();
      alert(`Bought NFT #${tokenId}`);
    } catch (err) {
      console.error(err);
      alert("Buy failed");
    }
    setLoading(false);
  };

  // ✅ Sell NFT
  const handleSell = async () => {
    if (!sellTokenId || !erc721Approved || !ownedNFTs.includes(Number(sellTokenId))) {
      return alert("Invalid NFT or not approved");
    }
    setLoading(true);
    try {
      const price = ethers.parseUnits("100", 18);
      const tx = await marketplace.listNFT(nft.target, sellTokenId, price);
      await tx.wait();
      setSellTokenId("");
    } catch (err) {
      console.error(err);
      alert("Sell failed");
    }
    setLoading(false);
  };

  // ✅ Delist NFT
  const handleDelist = async () => {
    if (!delistTokenId || !listedNFTs.includes(delistTokenId)) return alert("Cannot delist");

    setLoading(true);
    try {
      const tx = await marketplace.delistNFT(nft.target, delistTokenId);
      await tx.wait();
      setDelistTokenId("");
    } catch (err) {
      console.error(err);
      alert("Delist failed");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="bg-gray-900 border-2 border-green-500 p-6 rounded-md text-center text-green-300 pixelated w-[350px]">
        <h2 className="text-yellow-400 text-xl mb-2">🏪 Trade House</h2>
        {account && <p className="text-xs text-green-200 mb-4">Connected: {account}</p>}

        {/* Buy */}
        <div className="mb-4">
          <h3 className="text-green-400 mb-2">Buy NFTs</h3>
          {!erc20Approved ? (
            <Button onClick={handleApproveERC20} disabled={loading}>
              {loading ? "Processing..." : "Approve PokiToken"}
            </Button>
          ) : (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1)
                .filter((id) => !ownedNFTs.includes(id))
                .map((id) => (
                  <Button key={id} onClick={() => handleBuy(id)} disabled={loading}>
                    {loading ? "Processing..." : `Buy NFT #${id}`}
                  </Button>
                ))}
            </div>
          )}
        </div>

        {/* Sell */}
        <div className="mb-4">
          <h3 className="text-green-400 mb-2">Sell NFTs</h3>
          {!erc721Approved ? (
            <Button onClick={handleApproveERC721} disabled={loading}>
              {loading ? "Processing..." : "Approve NFT"}
            </Button>
          ) : (
            <div className="flex gap-2 justify-center">
              <select
                value={sellTokenId}
                onChange={(e) => setSellTokenId(e.target.value)}
                className="w-24 text-center border-2 border-green-400 bg-black text-green-200 pixelated rounded-md"
              >
                <option value="">Select NFT</option>
                {ownedNFTs.map((id) => (
                  <option key={id} value={id}>{`#${id}`}</option>
                ))}
              </select>
              <Button onClick={handleSell} disabled={loading || !sellTokenId}>
                {loading ? "Processing..." : "💰 Sell NFT"}
              </Button>
            </div>
          )}
        </div>

        {/* Delist */}
        <div className="mb-4">
          <h3 className="text-green-400 mb-2">Delist NFTs</h3>
          <div className="flex gap-2 justify-center">
            <select
              value={delistTokenId}
              onChange={(e) => setDelistTokenId(e.target.value)}
              className="w-24 text-center border-2 border-green-400 bg-black text-green-200 pixelated rounded-md"
            >
              <option value="">Select NFT</option>
              {listedNFTs.map((id) => (
                <option key={id} value={id}>{`#${id}`}</option>
              ))}
            </select>
            <Button onClick={handleDelist} disabled={loading || !delistTokenId}>
              {loading ? "Processing..." : "❌ Delist NFT"}
            </Button>
          </div>
        </div>

        <Button onClick={onClose} className="bg-gray-700 hover:bg-gray-800 mt-4">
          🚪 Quit
        </Button>
      </div>
    </div>
  );
}
