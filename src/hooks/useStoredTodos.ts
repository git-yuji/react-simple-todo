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
    // 保存を待たず、未保存の操作も含めた状態を直ちに画面へ反映します。
    pendingChanges.current.push(change);
    currentTodos.current = applyTodoChange(currentTodos.current, change);
    setTodos(currentTodos.current);

    // このタブでの連続操作も順番に保存します。
    queue.current = queue.current.then(async () => {
      const batch = [...pendingChanges.current];
      if (batch.length === 0) return;
      const result = await updateStoredTodos(batch, currentTodos.current);
      // 保存中に追加された操作は消さず、保存結果にも重ねて表示します。
      const newerChanges = pendingChanges.current.slice(batch.length);
      if (result.error === null) pendingChanges.current = newerChanges;
      currentTodos.current = newerChanges.reduce(applyTodoChange, result.todos);
      setTodos(currentTodos.current);
      setStorageError(result.error);
    });
  }

  function toggleTodo(id: string) {
    // Reactの再描画前でも、直前のクリックを含む最新状態を参照します。
    const todo = currentTodos.current.find((item) => item.id === id);
    if (todo) changeTodo({ type: 'set-completed', id, completed: !todo.completed });
  }

  return { todos, storageError, changeTodo, toggleTodo };
}
