import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function Navbar() {
  const [account, setAccount] = useState(null);

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const connectedAccount = accounts[0];
        setAccount(connectedAccount);
      } catch (error) {
        console.error("Error connecting to MetaMask:", error);
      }
    } else {
      console.error("MetaMask is not installed.");
    }
  };

  useEffect(() => {
    // connectMetaMask();
  }, []);

  const disconnectMetaMask = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        setAccount(null);
      } catch (error) {
        console.error("Error disconnecting from MetaMask:", error);
      }
    } else {
      console.error("MetaMask is not installed.");
    }
  };

  return (
    <nav className="flex dark:bg-sky-900 items-center justify-between bg-white px-10 py-6 w-full fixed top-0">
      <div>
        <Link href="/" className="text-2xl font-sans font-extrabold">
          Decentroz
        </Link>
      </div>
      <div className="flex-grow">
        <ul className="flex justify-center space-x-5 items-center">
          <li>
            <Link href="/Explore">Explore</Link>
          </li>
          <li>
            <Link href="/Create">Create</Link>
          </li>
          <li>
            <Link href="/Profile">Profile</Link>
          </li>
        </ul>
      </div>
      <div>
        {account ? (
          <div className="flex items-center space-x-2">
            <span>
              Connected Account: {account.slice(0, 4)}...{account.slice(38, 42)}
            </span>
            <button
              onClick={disconnectMetaMask}
              className="bg-red text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={connectMetaMask}
          >
            Connect
          </button>
        )}
      </div>
    </nav>
  );
}
