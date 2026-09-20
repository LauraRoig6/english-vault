import { useState, useEffect, useCallback } from 'react';
import { initialRecords } from '../mock';

const STORAGE_KEY = 'english_vault_data_v1';

export function useVault() {
  const [records, setRecords] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecords(JSON.parse(stored));
      } else {
        setRecords(initialRecords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRecords));
      }
    } catch (e) {
      setRecords(initialRecords);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      } catch (e) { /* ignore */ }
    }
  }, [records, loaded]);

  const create = useCallback((record) => {
    const newRecord = {
      ...record,
      __backendId: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      created_at: record.created_at || new Date().toISOString(),
    };
    setRecords((prev) => [...prev, newRecord]);
    return newRecord;
  }, []);

  const update = useCallback((record) => {
    setRecords((prev) => prev.map((r) => (r.__backendId === record.__backendId ? { ...r, ...record } : r)));
    return record;
  }, []);

  const remove = useCallback((record) => {
    setRecords((prev) => prev.filter((r) => r.__backendId !== record.__backendId));
  }, []);

  const replaceAll = useCallback((newRecords) => {
    setRecords(newRecords);
  }, []);

  return { records, create, update, remove, replaceAll, loaded };
}
