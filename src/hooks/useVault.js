import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchEntries, insertEntry, updateEntry, deleteEntry, clearEntries, ensureFreshSession } from '../lib/supabase';

const STORAGE_KEY = 'english_vault_data_v1';

function cloudRowToRecord(row) {
  return {
    ...(row?.data || {}),
    __backendId: row.id,
    created_at: row?.data?.created_at || row.created_at,
  };
}

function getLocalRecords() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const rows = stored ? JSON.parse(stored) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function useVault(session) {
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [syncError, setSyncError] = useState('');
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const getSession = useCallback(async () => {
    const fresh = await ensureFreshSession(sessionRef.current);
    if (!fresh) throw new Error('Your session expired. Sign in again.');
    sessionRef.current = fresh;
    return fresh;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoaded(false);
        setSyncError('');
        const auth = await getSession();
        let rows = await fetchEntries(auth);

        // First cloud login: move the existing browser vault into Supabase automatically.
        if ((!rows || rows.length === 0)) {
          const local = getLocalRecords().filter((r) => r && r.word && r.type);
          if (local.length) {
            const migrated = [];
            for (const record of local) {
              const row = await insertEntry(auth, auth.user.id, record);
              if (row) migrated.push(row);
            }
            rows = migrated;
          }
        }

        const next = (rows || []).map(cloudRowToRecord);
        if (active) {
          setRecords(next);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      } catch (err) {
        if (active) setSyncError(err?.message || 'Could not sync your vault.');
      } finally {
        if (active) setLoaded(true);
      }
    })();
    return () => { active = false; };
  }, [getSession]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); } catch { /* ignore */ }
  }, [records, loaded]);

  const create = useCallback((record) => {
    const tempId = 'tmp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    const optimistic = {
      ...record,
      __backendId: tempId,
      created_at: record.created_at || new Date().toISOString(),
    };
    setRecords((prev) => [...prev, optimistic]);

    (async () => {
      try {
        const auth = await getSession();
        const row = await insertEntry(auth, auth.user.id, optimistic);
        if (!row) return;
        const saved = cloudRowToRecord(row);
        setRecords((prev) => prev.map((r) => r.__backendId === tempId ? saved : r));
      } catch (err) {
        setRecords((prev) => prev.filter((r) => r.__backendId !== tempId));
        setSyncError(err?.message || 'Could not save this entry online.');
      }
    })();

    return optimistic;
  }, [getSession]);

  const update = useCallback((record) => {
    const previousHolder = { value: null };
    setRecords((prev) => prev.map((r) => {
      if (r.__backendId !== record.__backendId) return r;
      previousHolder.value = r;
      return { ...r, ...record };
    }));

    if (!String(record.__backendId || '').startsWith('tmp_')) {
      (async () => {
        try {
          const auth = await getSession();
          const row = await updateEntry(auth, record.__backendId, record);
          if (row) {
            const saved = cloudRowToRecord(row);
            setRecords((prev) => prev.map((r) => r.__backendId === record.__backendId ? saved : r));
          }
        } catch (err) {
          if (previousHolder.value) {
            setRecords((prev) => prev.map((r) => r.__backendId === record.__backendId ? previousHolder.value : r));
          }
          setSyncError(err?.message || 'Could not update this entry online.');
        }
      })();
    }
    return record;
  }, [getSession]);

  const remove = useCallback((record) => {
    setRecords((prev) => prev.filter((r) => r.__backendId !== record.__backendId));
    if (!String(record.__backendId || '').startsWith('tmp_')) {
      (async () => {
        try {
          const auth = await getSession();
          await deleteEntry(auth, record.__backendId);
        } catch (err) {
          setRecords((prev) => [...prev, record]);
          setSyncError(err?.message || 'Could not delete this entry online.');
        }
      })();
    }
  }, [getSession]);

  const replaceAll = useCallback((newRecords) => {
    setRecords(newRecords);
    (async () => {
      try {
        const auth = await getSession();
        await clearEntries(auth);
        const uploaded = [];
        for (const record of newRecords) {
          const row = await insertEntry(auth, auth.user.id, record);
          if (row) uploaded.push(cloudRowToRecord(row));
        }
        setRecords(uploaded);
      } catch (err) {
        setSyncError(err?.message || 'Could not replace the cloud vault.');
      }
    })();
  }, [getSession]);

  const reload = useCallback(async () => {
    try {
      setSyncError('');
      const auth = await getSession();
      const rows = await fetchEntries(auth);
      setRecords((rows || []).map(cloudRowToRecord));
    } catch (err) {
      setSyncError(err?.message || 'Could not refresh the vault.');
    }
  }, [getSession]);

  return { records, create, update, remove, replaceAll, loaded, syncError, reload };
}
