"use client";
import SpaceShooterGame from './components/SpaceShooterGame';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <SpaceShooterGame />
    </div>
  );
}