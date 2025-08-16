"use client";
import { useState } from 'react';
import SpaceShooterGame from './components/SpaceShooterGame';
import AuthComponent from './components/AuthComponent';
import ScoreDebugger from './components/ScoreDebugger';

export default function Home() {
  const [playerAddress, setPlayerAddress] = useState<string>("");

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <AuthComponent onAddressChange={setPlayerAddress} />
      <SpaceShooterGame playerAddress={playerAddress} />
      {playerAddress && <ScoreDebugger playerAddress={playerAddress} />}
    </div>
  );
}