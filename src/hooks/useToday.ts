import { useEffect, useState } from 'react';
import { localDateKey } from '../utils/dueDate';

export function useToday() {
  const [today, setToday] = useState(() => localDateKey(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function syncToday() {
      clearTimeout(timer);
      const now = new Date();
      setToday(localDateKey(now));
      // 翌日のローカル午前0時。夏時間による1日の長さの違いも反映します。
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      timer = setTimeout(syncToday, Math.max(1000, midnight.getTime() - now.getTime()));
    }
    syncToday();
    window.addEventListener('focus', syncToday);
    document.addEventListener('visibilitychange', syncToday);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', syncToday);
      document.removeEventListener('visibilitychange', syncToday);
    };
  }, []);

  return today;
}
