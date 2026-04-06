import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Skull, Zap, Play, RotateCcw, Target } from 'lucide-react';
import { ZombieType, GameState } from './types';
import { WORDS, INITIAL_HEALTH, SPAWN_RATE_BASE, SPEED_BASE, LEVEL_UP_SCORE } from './constants';
import Zombie from './components/Zombie';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    health: INITIAL_HEALTH,
    level: 1,
    zombies: [],
    userInput: '',
  });

  const gameLoopRef = useRef<number>(null);
  const lastSpawnTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sound effects (simulated with visual feedback for now)
  const [shake, setShake] = useState(false);

  const spawnZombie = useCallback(() => {
    const randomWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    const newZombie: ZombieType = {
      id: Math.random().toString(36).substr(2, 9),
      word: randomWord,
      x: Math.random() * 80 + 10, // 10% to 90%
      y: -10,
      speed: SPEED_BASE + (gameState.level * 0.01),
      maxHealth: randomWord.length,
      currentHealth: randomWord.length,
    };
    setGameState(prev => ({
      ...prev,
      zombies: [...prev.zombies, newZombie]
    }));
  }, [gameState.level]);

  const updateGame = useCallback((time: number) => {
    if (gameState.status !== 'playing') return;

    // Spawning logic
    const spawnInterval = Math.max(500, SPAWN_RATE_BASE - (gameState.level * 150));
    if (time - lastSpawnTimeRef.current > spawnInterval) {
      spawnZombie();
      lastSpawnTimeRef.current = time;
    }

    // Movement and collision logic
    setGameState(prev => {
      let healthReduced = 0;
      const updatedZombies = prev.zombies.map(z => ({
        ...z,
        y: z.y + z.speed
      })).filter(z => {
        if (z.y >= 90) {
          healthReduced += 10;
          return false;
        }
        return true;
      });

      if (healthReduced > 0) {
        setShake(true);
        setTimeout(() => setShake(false), 200);
      }

      const newHealth = Math.max(0, prev.health - healthReduced);
      const newStatus = newHealth <= 0 ? 'gameover' : prev.status;

      return {
        ...prev,
        health: newHealth,
        status: newStatus,
        zombies: updatedZombies
      };
    });

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [gameState.status, gameState.level, spawnZombie]);

  useEffect(() => {
    if (gameState.status === 'playing') {
      gameLoopRef.current = requestAnimationFrame(updateGame);
    } else {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState.status, updateGame]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.status !== 'playing') return;
      
      const char = e.key.toLowerCase();
      if (!/^[a-z]$/.test(char)) return;

      setGameState(prev => {
        const currentInput = prev.userInput + char;
        
        // Find if any zombie word starts with this input
        const matchingZombie = prev.zombies.find(z => z.word.startsWith(currentInput));
        
        if (matchingZombie) {
          // If word completed
          if (matchingZombie.word === currentInput) {
            const newScore = prev.score + (matchingZombie.word.length * 10);
            const newLevel = Math.floor(newScore / LEVEL_UP_SCORE) + 1;
            
            return {
              ...prev,
              score: newScore,
              level: newLevel,
              userInput: '',
              zombies: prev.zombies.filter(z => z.id !== matchingZombie.id)
            };
          }
          return { ...prev, userInput: currentInput };
        } else {
          // Reset input if no match
          return { ...prev, userInput: '' };
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status]);

  const startGame = () => {
    setGameState({
      status: 'playing',
      score: 0,
      health: INITIAL_HEALTH,
      level: 1,
      zombies: [],
      userInput: '',
    });
    lastSpawnTimeRef.current = performance.now();
  };

  return (
    <div 
      className={`min-h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col transition-transform duration-100 ${shake ? 'scale-105 translate-y-1' : ''}`}
      ref={containerRef}
    >
      {/* HUD - Header */}
      <header className="p-6 flex justify-between items-start z-50 pointer-events-none">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Skull className="w-8 h-8 text-green-500" />
            <h1 className="text-4xl font-black tracking-tighter uppercase italic">ZOMBIE TYPE HERO</h1>
          </div>
          <div className="flex gap-4 text-xs font-mono text-green-500/60 uppercase tracking-[0.2em]">
            <span>SYSTEM_READY</span>
            <span>LEVEL_{gameState.level.toString().padStart(2, '0')}</span>
            <span>SCORE_{gameState.score.toString().padStart(6, '0')}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3 bg-black/40 border border-green-500/20 px-4 py-2 rounded-full backdrop-blur-md">
            <Heart className={`w-5 h-5 ${gameState.health < 30 ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
            <div className="w-48 h-2 bg-green-900/30 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${gameState.health < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                initial={{ width: '100%' }}
                animate={{ width: `${gameState.health}%` }}
              />
            </div>
            <span className="font-mono text-sm min-w-[3ch]">{gameState.health}%</span>
          </div>
        </div>
      </header>

      {/* Game Area */}
      <main className="flex-1 relative">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, #22c55e 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} 
        />
        
        {/* Atmosphere Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-green-900/20 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-red-900/10 to-transparent" />
        </div>

        {/* Zombies */}
        <AnimatePresence>
          {gameState.zombies.map(zombie => (
            <Zombie 
              key={zombie.id} 
              zombie={zombie} 
              isTargeted={gameState.userInput !== '' && zombie.word.startsWith(gameState.userInput)}
              typedChars={gameState.userInput}
            />
          ))}
        </AnimatePresence>

        {/* Player Base / Shield Line */}
        <div className="absolute bottom-[10%] left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent shadow-[0_0_20px_rgba(34,197,94,0.5)]" />

        {/* Current Input Display */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="text-xs font-mono text-green-500/40 uppercase tracking-widest">ACTIVE_INPUT</div>
          <div className="text-6xl font-black tracking-widest text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)] min-h-[1.2em]">
            {gameState.userInput || <span className="opacity-10">_</span>}
          </div>
        </div>

        {/* Overlay Menus */}
        <AnimatePresence>
          {gameState.status === 'idle' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            >
              <div className="text-center space-y-8 max-w-md p-12 border border-green-500/20 bg-black/40 rounded-3xl">
                <div className="space-y-4">
                  <Skull className="w-20 h-20 text-green-500 mx-auto" />
                  <h2 className="text-5xl font-black tracking-tighter italic uppercase">DEFEND THE TERMINAL</h2>
                  <p className="text-green-500/60 font-mono text-sm leading-relaxed">
                    Zombies are approaching. Type the words floating above them to eliminate the threat. 
                    Don't let them reach the defense line.
                  </p>
                </div>
                <button 
                  onClick={startGame}
                  className="group relative px-8 py-4 bg-green-500 text-black font-bold uppercase tracking-widest rounded-full hover:bg-green-400 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <Play className="w-5 h-5 fill-current" />
                  INITIALIZE_COMBAT
                </button>
              </div>
            </motion.div>
          )}

          {gameState.status === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] flex items-center justify-center bg-red-950/90 backdrop-blur-md"
            >
              <div className="text-center space-y-8 max-w-md p-12 border border-red-500/20 bg-black/40 rounded-3xl">
                <div className="space-y-4">
                  <Target className="w-20 h-20 text-red-500 mx-auto animate-pulse" />
                  <h2 className="text-6xl font-black tracking-tighter italic uppercase text-red-500">TERMINAL_BREACHED</h2>
                  <div className="space-y-1">
                    <div className="text-red-500/40 font-mono text-xs uppercase tracking-widest">FINAL_SCORE</div>
                    <div className="text-4xl font-mono font-bold text-white">{gameState.score.toLocaleString()}</div>
                  </div>
                </div>
                <button 
                  onClick={startGame}
                  className="group relative px-8 py-4 bg-red-500 text-white font-bold uppercase tracking-widest rounded-full hover:bg-red-400 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 mx-auto shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                >
                  <RotateCcw className="w-5 h-5" />
                  REBOOT_SYSTEM
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="p-4 border-t border-green-500/10 bg-black/40 flex justify-between items-center text-[10px] font-mono text-green-500/30 uppercase tracking-widest">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span>CONNECTION_STABLE</span>
          </div>
          <span>ENCRYPTION_ACTIVE</span>
        </div>
        <div>ALFRED_E_LIN // SYSTEM_V1.0</div>
      </footer>
    </div>
  );
}
