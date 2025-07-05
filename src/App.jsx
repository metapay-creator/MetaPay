import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { abi, contractAddress } from "./abi";
import "./App.css";

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [balances, setBalances] = useState([]);
  const [userAddresses, setUserAddresses] = useState([]);
  const [nationalBalance, setNationalBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [notification, setNotification] = useState("");

  const connectWallet = async () => {
    if (window.ethereum) {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethProvider.getSigner();
      const address = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      setProvider(ethProvider);
      setSigner(signer);
      setWalletAddress(address);
      setContract(contract);
    } else {
      alert("Please install MetaMask.");
    }
  };

  const fetchBalances = async () => {
    if (!contract) return;
    setLoading(true);

    try {
      const [addresses, rawBalances] = await contract.checkAll();
      const nationalAddress = await contract.nationalWallet();
      const national = await contract.balances(nationalAddress);
      const formattedBalances = rawBalances.map(b => Number(b.toString()));

      setUserAddresses(addresses);
      setBalances(formattedBalances);
      setNationalBalance(national.toString());
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch balances:", err);
    }

    setLoading(false);
  };

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleDistribute = async () => {
    try {
      const tx = await contract.distribute();
      await tx.wait();
      setTimeout(fetchBalances, 1000);
      showNotification("✅ Distribution completed.");
    } catch (err) {
      console.error("Distribute failed:", err);
      showNotification("❌ Distribution failed.");
    }
  };

  const handleCollect = async () => {
    try {
      const tx = await contract.collect();
      await tx.wait();
      setTimeout(fetchBalances, 1000);
      showNotification("✅ Collection completed.");
    } catch (err) {
      console.error("Collect failed:", err);
      showNotification("❌ Collection failed.");
    }
  };

  const handleReset = async () => {
    try {
      const tx = await contract.resetAll();
      await tx.wait();
      setTimeout(fetchBalances, 1000);
      showNotification("✅ Reset completed.");
    } catch (err) {
      console.error("Reset failed:", err);
      showNotification("❌ Reset failed.");
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (contract && walletAddress) {
      fetchBalances();
    }
  }, [contract, walletAddress]);

  return (
    <div className="container">
      {notification && <div className="toast">{notification}</div>}

      <div className="app">
        <h2>MetaPay Simulation</h2>
        <p><strong>Connected Wallet:</strong> {walletAddress}</p>

        <h3>National Wallet Balance</h3>
        <p>{loading ? "🔄 Updating..." : `${nationalBalance} units`}</p>
        <p className="timestamp">Last updated: {lastUpdated}</p>

        <div className="button-group">
          <button className="action-button" onClick={handleDistribute}>📤 Distribute</button>
          <button className="action-button" onClick={handleCollect}>🔁 Collect</button>
          <button className="action-button" onClick={handleReset}>🔄 Reset</button>
        </div>

        <h3>Citizen Wallets</h3>
        {loading ? (
          <p>Loading wallets...</p>
        ) : (
          <div className="wallet-grid">
            {userAddresses.map((addr, idx) => (
              <div className="wallet-card" key={idx}>
                <strong>User {idx + 1}</strong><br />
                Balance: {balances[idx] !== undefined ? balances[idx] : "…"} units
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
