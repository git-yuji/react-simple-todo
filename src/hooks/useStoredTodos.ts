import { useEffect, useRef, useState } from 'react';
import { applyTodoChange, loadTodos, TODO_STORAGE_KEY, updateStoredTodos } from '../utils/todoStorage';
import type { TodoChange } from '../utils/todoStorage';

export function useStoredTodos() {
  const [initialStorage] = useState(loadTodos);
  const [todos, setTodos] = useState(initialStorage.todos);
  const [storageError, setStorageError] = useState(initialStorage.error);
  const currentTodos = useRef(todos);
  const queue = useRef(Promise.resolve());
  const pendingChanges = useRef<TodoChange[]>([]);

  useEffect(() => {
    function syncTodos() {
      const latest = loadTodos();
      if (latest.error) {
        setStorageError(latest.error);
        return;
      }
      const synced = pendingChanges.current.reduce(applyTodoChange, latest.todos);
      currentTodos.current = synced;
      setTodos(synced);
      if (pendingChanges.current.length === 0) setStorageError(null);
    }

    function onStorage(event: StorageEvent) {
      // clear()の場合はkeyがnullになります。
      if (event.key !== null && event.key !== TODO_STORAGE_KEY) return;
      try {
        if (event.storageArea === window.localStorage) syncTodos();
      } catch {
        setStorageError('保存済みのTodoを読み込めませんでした。');
      }
    }

    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', syncTodos);
    // 初回読み込みからイベント登録までの間の更新も取り込みます。
    syncTodos();
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', syncTodos);
    };
  }, []);

  function changeTodo(change: TodoChange) {
    // このタブでの連続操作も順番に処理します。
    queue.current = queue.current.then(async () => {
      pendingChanges.current.push(change);
      const result = await updateStoredTodos(pendingChanges.current, currentTodos.current);
      if (result.error === null) pendingChanges.current = [];
      currentTodos.current = result.todos;
      setTodos(result.todos);
      setStorageError(result.error);
    });
  }

  return { todos, storageError, changeTodo };
}
