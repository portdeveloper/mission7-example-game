"use client";
import SpaceShooterGame from './components/SpaceShooterGame';
import AuthComponent from './components/AuthComponent';

export default function Home() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-8">
      <AuthComponent />
      <SpaceShooterGame />
    </div>
  );
}