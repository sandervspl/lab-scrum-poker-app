'use client';

import type React from 'react';
import { createContext, useContext, useState } from 'react';

type RoomContextType = {
  hasCelebrated: boolean;
  setHasCelebrated: React.Dispatch<React.SetStateAction<boolean>>;
};

const RoomContext = createContext<RoomContextType>({
  hasCelebrated: false,
  setHasCelebrated: () => {},
});

export function RoomProvider({ children }: { children: React.ReactNode }) {
  const [hasCelebrated, setHasCelebrated] = useState(false);

  return <RoomContext value={{ hasCelebrated, setHasCelebrated }}>{children}</RoomContext>;
}

export function useRoomContext() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
}
