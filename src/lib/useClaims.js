import { useCallback, useEffect, useState } from 'react';
import { listMyClaims } from './shifts';

// Loads the signed-in nurse's claims (each with its shift attached) and lets a page refresh them.
export function useClaims(nurseId) {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!nurseId) return;
    const data = await listMyClaims(nurseId);
    setClaims(data);
    setLoading(false);
  }, [nurseId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { claims, loading, refresh };
}
