import { motion } from "motion/react";
import { ZombieType } from "../types";
import React from 'react';

interface ZombieProps {
  zombie: ZombieType;
  isTargeted: boolean;
  typedChars: string;
}

const Zombie = React.memo(({ zombie, isTargeted, typedChars }: ZombieProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        left: `${zombie.x}%`,
        top: `${zombie.y}%`
      }}
      transition={{ duration: 0.1, ease: "linear" }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
      style={{ zIndex: Math.floor(zombie.y) }}
    >
      {/* Zombie Visual */}
      <div className={`relative w-12 h-16 bg-green-900 border-2 border-green-400 rounded-t-full flex flex-col items-center justify-end pb-2 shadow-lg shadow-green-900/50 ${isTargeted ? 'ring-4 ring-red-500 ring-offset-2 ring-offset-black' : ''}`}>
        <div className="flex gap-2 mb-4">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
        <div className="w-8 h-1 bg-green-700 rounded-full mb-1" />
      </div>

      {/* Word Label */}
      <div className="mt-2 px-3 py-1 bg-black/80 border border-green-500/30 rounded text-sm font-mono tracking-widest whitespace-nowrap overflow-hidden">
        {zombie.word.split('').map((char, i) => {
          const isTyped = isTargeted && i < typedChars.length;
          return (
            <span 
              key={i} 
              className={isTyped ? "text-red-500 font-bold" : "text-green-400 opacity-60"}
            >
              {char}
            </span>
          );
        })}
      </div>
    </motion.div>
  );
});

Zombie.displayName = 'Zombie';

export default Zombie;
