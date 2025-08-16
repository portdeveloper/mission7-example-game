"use client";
import { useEffect, useRef, useState } from 'react';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Player extends GameObject {
  health: number;
}

interface Enemy extends GameObject {
  lastShot: number;
}

interface Bullet extends GameObject {
  isPlayerBullet: boolean;
}

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_SPEED = 2;
const ENEMY_SPAWN_RATE = 0.02;
const ENEMY_SHOOT_COOLDOWN = 1000;

export default function SpaceShooterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number>(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const gameStateRef = useRef({
    player: { x: GAME_WIDTH / 2 - 15, y: GAME_HEIGHT - 50, width: 30, height: 30, speed: PLAYER_SPEED, health: 1 } as Player,
    enemies: [] as Enemy[],
    playerBullets: [] as Bullet[],
    enemyBullets: [] as Bullet[],
    keys: { a: false, d: false, space: false },
    lastPlayerShot: 0,
    isRunning: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'd' || key === ' ' || key === 'r') {
        e.preventDefault();
        if (key === 'r') {
          console.log('R key pressed, gameOver:', gameOver);
          // Always allow restart with 'r', regardless of game state
          startGame();
          return;
        } else if (key === ' ') {
          gameStateRef.current.keys.space = true;
        } else {
          gameStateRef.current.keys[key as 'a' | 'd'] = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'd' || key === ' ') {
        e.preventDefault();
        if (key === ' ') {
          gameStateRef.current.keys.space = false;
        } else if (key === 'a' || key === 'd') {
          gameStateRef.current.keys[key as 'a' | 'd'] = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    gameStateRef.current = {
      player: { x: GAME_WIDTH / 2 - 15, y: GAME_HEIGHT - 50, width: 30, height: 30, speed: PLAYER_SPEED, health: 1 },
      enemies: [],
      playerBullets: [],
      enemyBullets: [],
      keys: { a: false, d: false, space: false },
      lastPlayerShot: 0,
      isRunning: true
    };
    
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }
    gameLoop();
  };

  const gameLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentTime = Date.now();
    const gameState = gameStateRef.current;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Move player
    if (gameState.keys.a && gameState.player.x > 0) {
      gameState.player.x -= gameState.player.speed;
    }
    if (gameState.keys.d && gameState.player.x < GAME_WIDTH - gameState.player.width) {
      gameState.player.x += gameState.player.speed;
    }

    // Player shooting
    if (gameState.keys.space && currentTime - gameState.lastPlayerShot > 150) {
      gameState.playerBullets.push({
        x: gameState.player.x + gameState.player.width / 2 - 2,
        y: gameState.player.y,
        width: 4,
        height: 10,
        speed: BULLET_SPEED,
        isPlayerBullet: true
      });
      gameState.lastPlayerShot = currentTime;
    }

    // Spawn enemies
    if (Math.random() < ENEMY_SPAWN_RATE) {
      gameState.enemies.push({
        x: Math.random() * (GAME_WIDTH - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: ENEMY_SPEED,
        lastShot: currentTime
      });
    }

    // Move and update enemies
    gameState.enemies.forEach((enemy, enemyIndex) => {
      enemy.y += enemy.speed;

      // Enemy shooting
      if (currentTime - enemy.lastShot > ENEMY_SHOOT_COOLDOWN) {
        gameState.enemyBullets.push({
          x: enemy.x + enemy.width / 2 - 2,
          y: enemy.y + enemy.height,
          width: 4,
          height: 10,
          speed: BULLET_SPEED,
          isPlayerBullet: false
        });
        enemy.lastShot = currentTime;
      }

      // Remove enemies that are off screen
      if (enemy.y > GAME_HEIGHT) {
        gameState.enemies.splice(enemyIndex, 1);
      }
    });

    // Move player bullets
    gameState.playerBullets.forEach((bullet, bulletIndex) => {
      bullet.y -= bullet.speed;
      if (bullet.y < 0) {
        gameState.playerBullets.splice(bulletIndex, 1);
      }
    });

    // Move enemy bullets
    gameState.enemyBullets.forEach((bullet, bulletIndex) => {
      bullet.y += bullet.speed;
      if (bullet.y > GAME_HEIGHT) {
        gameState.enemyBullets.splice(bulletIndex, 1);
      }
    });

    // Collision detection - player bullets vs enemies
    gameState.playerBullets.forEach((bullet, bulletIndex) => {
      gameState.enemies.forEach((enemy, enemyIndex) => {
        if (bullet.x < enemy.x + enemy.width &&
            bullet.x + bullet.width > enemy.x &&
            bullet.y < enemy.y + enemy.height &&
            bullet.y + bullet.height > enemy.y) {
          gameState.playerBullets.splice(bulletIndex, 1);
          gameState.enemies.splice(enemyIndex, 1);
          setScore(prev => prev + 10);
        }
      });
    });

    // Collision detection - enemy bullets vs player
    gameState.enemyBullets.forEach((bullet, bulletIndex) => {
      if (bullet.x < gameState.player.x + gameState.player.width &&
          bullet.x + bullet.width > gameState.player.x &&
          bullet.y < gameState.player.y + gameState.player.height &&
          bullet.y + bullet.height > gameState.player.y) {
        gameState.isRunning = false;
        setGameOver(true);
        setGameStarted(false);
        return;
      }
    });

    // Collision detection - enemies vs player
    gameState.enemies.forEach((enemy) => {
      if (enemy.x < gameState.player.x + gameState.player.width &&
          enemy.x + enemy.width > gameState.player.x &&
          enemy.y < gameState.player.y + gameState.player.height &&
          enemy.y + enemy.height > gameState.player.y) {
        gameState.isRunning = false;
        setGameOver(true);
        setGameStarted(false);
        return;
      }
    });

    // Draw player (square)
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(gameState.player.x, gameState.player.y, gameState.player.width, gameState.player.height);

    // Draw enemies (triangles)
    ctx.fillStyle = '#ff0000';
    gameState.enemies.forEach(enemy => {
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
      ctx.lineTo(enemy.x, enemy.y + enemy.height);
      ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
      ctx.closePath();
      ctx.fill();
    });

    // Draw bullets
    ctx.fillStyle = '#ffff00';
    [...gameState.playerBullets, ...gameState.enemyBullets].forEach(bullet => {
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });

    if (gameState.isRunning) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  };

  useEffect(() => {
    // Initial canvas setup
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="text-white text-2xl font-bold">Score: {score}</div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          className="border border-gray-500"
          style={{ background: '#000' }}
        />
        
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
            <div className="text-center text-white">
              <button
                onClick={startGame}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded mb-4 text-lg"
              >
                {gameOver ? 'Play Again' : 'Start Game'}
              </button>
              {gameOver && (
                <div className="text-red-500 text-xl font-bold mb-4">
                  Game Over! Final Score: {score}
                </div>
              )}
              <div className="text-white text-sm space-y-1">
                {gameOver ? (
                  <p>Press R to play again</p>
                ) : (
                  <>
                    <p>Use A/D keys to move left/right</p>
                    <p>Press SPACE to shoot</p>
                    <p>Avoid enemies and their bullets!</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {gameStarted && (
        <div className="text-white text-sm">
          <p>A/D: Move • SPACE: Shoot</p>
          <p>R: Restart (works anytime)</p>
        </div>
      )}
    </div>
  );
}