import React from 'react';
import { motion } from 'motion/react';
import { MultiplayerLeaderboard } from '../MultiplayerLeaderboard';
import type { MathDuelController } from '../useMathDuel';

export const LeaderboardView: React.FC<{ duel: MathDuelController }> = ({ duel }) => {
  const { setState } = duel;

  return (
    <motion.div
      key="leaderboard"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col h-full"
    >
      <MultiplayerLeaderboard onBack={() => setState('lobby')} />
    </motion.div>
  );
};
