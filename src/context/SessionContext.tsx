'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { RecruiterContext } from '@/lib/types';

interface SessionContextValue {
  context: RecruiterContext;
  setContext: (ctx: RecruiterContext) => void;
}

const SessionContext = createContext<SessionContextValue>({
  context: {},
  setContext: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<RecruiterContext>({});
  return (
    <SessionContext.Provider value={{ context, setContext }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}
