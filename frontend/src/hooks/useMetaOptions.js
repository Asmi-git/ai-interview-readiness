import { useEffect, useState } from 'react';
import { fetchOptions } from '../api/metaApi';

/** Loads the shared config (target roles, education levels, skill catalog) from the backend. */
export function useMetaOptions() {
  const [options, setOptions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchOptions()
      .then((body) => {
        if (!cancelled) setOptions(body);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, isLoading, error };
}
