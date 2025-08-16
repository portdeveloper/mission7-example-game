"use client";
import { useEffect, useState } from "react";
import {
  usePrivy,
  CrossAppAccountWithMetadata,
} from "@privy-io/react-auth";

export default function AuthComponent() {
  const { authenticated, user, ready, logout, login } = usePrivy();
  const [accountAddress, setAccountAddress] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    // Check if privy is ready and user is authenticated
    if (authenticated && user && ready) {
      // Check if user has linkedAccounts
      if (user.linkedAccounts.length > 0) {
        // Get the cross app account created using Monad Games ID        
        const crossAppAccount: CrossAppAccountWithMetadata = user.linkedAccounts.filter(account => account.type === "cross_app" && account.providerApp.id === "cmd8euall0037le0my79qpz42")[0] as CrossAppAccountWithMetadata;

        // The first embedded wallet created using Monad Games ID, is the wallet address
        if (crossAppAccount.embeddedWallets.length > 0) {
          setAccountAddress(crossAppAccount.embeddedWallets[0].address);
        }
      } else {
        setMessage("You need to link your Monad Games ID account to continue.");
      }
    }
  }, [authenticated, user, ready]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xl font-semibold">Please login to continue</h2>
        <button 
          onClick={login}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Authentication Status</h2>
      
      {accountAddress ? (
        <div className="text-center">
          <p className="text-green-600 mb-2">Connected to Monad Games ID</p>
          <p className="text-sm font-mono bg-gray-100 p-2 rounded">
            Wallet: {accountAddress}
          </p>
        </div>
      ) : message ? (
        <p className="text-red-600">{message}</p>
      ) : (
        <p className="text-yellow-600">Checking account status...</p>
      )}
      
      <button 
        onClick={logout}
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}