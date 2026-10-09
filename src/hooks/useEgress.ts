import { useState, useEffect } from 'react';

export interface EgressCall {
  url: string;
  method: string;
  bodyBytes: number;
  host?: string;
  ts: number;
}

declare global {
  interface Window {
    __egress?: EgressCall[];
  }
}

export function useEgress(): {
  calls: EgressCall[];
  count: number;
  isAirplaneReady: boolean;
} {
  const [calls, setCalls] = useState<EgressCall[]>(() => {
    if (typeof window !== 'undefined' && window.__egress) {
      return [...window.__egress];
    }
    return [];
  });

  const [isAirplaneReady, setIsAirplaneReady] = useState<boolean>(false);

  useEffect(() => {
    setIsAirplaneReady(true);

    const handleEgressCall = () => {
      if (typeof window !== 'undefined' && window.__egress) {
        setCalls([...window.__egress]);
      }
    };

    window.addEventListener('egress-call', handleEgressCall);
    return () => {
      window.removeEventListener('egress-call', handleEgressCall);
    };
  }, []);

  return {
    calls,
    count: calls.length,
    isAirplaneReady,
  };
}
