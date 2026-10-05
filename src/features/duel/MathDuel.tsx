import React from 'react';
import { AnimatePresence } from 'motion/react';
import { useMathDuel } from './useMathDuel';
import type { MathDuelProps } from './types';
import { LobbyView } from './views/LobbyView';
import { SearchingView } from './views/SearchingView';
import { CreateRoomView } from './views/CreateRoomView';
import { JoinRoomView } from './views/JoinRoomView';
import { WaitingRoomView } from './views/WaitingRoomView';
import { PlayingView } from './views/PlayingView';
import { ResultView } from './views/ResultView';
import { RoomPlayingView } from './views/RoomPlayingView';
import { RoomResultView } from './views/RoomResultView';
import { LeaderboardView } from './views/LeaderboardView';

export const MathDuel: React.FC<MathDuelProps> = (props) => {
  const duel = useMathDuel(props);
  const { state } = duel;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-x-hidden overflow-y-auto no-scrollbar pb-20">
      <AnimatePresence mode="wait">
        {state === 'lobby' && <LobbyView key="lobby" duel={duel} />}

        {state === 'searching' && <SearchingView key="searching" duel={duel} />}

        {state === 'create_room' && <CreateRoomView key="create_room" duel={duel} />}

        {state === 'join_room' && <JoinRoomView key="join_room" duel={duel} />}

        {state === 'waiting_room' && <WaitingRoomView key="waiting_room" duel={duel} />}

        {state === 'playing' && <PlayingView key="playing" duel={duel} />}

        {state === 'result' && <ResultView key="result" duel={duel} />}
        {state === 'room_playing' && <RoomPlayingView key="room_playing" duel={duel} />}

        {state === 'room_result' && <RoomResultView key="room_result" duel={duel} />}
        {state === 'leaderboard' && <LeaderboardView key="leaderboard" duel={duel} />}
      </AnimatePresence>
    </div>
  );
};
