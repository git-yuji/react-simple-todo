import { useEffect, useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import TodoFilters from './components/TodoFilters';
import type { Todo } from './types/todo';
import { filterTodos } from './utils/filterTodos';
import type { TodoStatus } from './utils/filterTodos';
import { loadTodos, saveTodos } from './utils/todoStorage';

export default function App() {
  // state（状態）が変わると、Reactが画面を更新します。
  const [initialStorage] = useState(loadTodos);
  const [todos, setTodos] = useState<Todo[]>(initialStorage.todos);
  const [storageError, setStorageError] = useState(initialStorage.error);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TodoStatus>('all');

  useEffect(() => {
    // 初回は書き込まず、ユーザーがTodoを変更したときだけ保存します。
    if (todos === initialStorage.todos) return;
    setStorageError(saveTodos(todos));
  }, [todos, initialStorage]);

  function addTodo(title: string) {
    const newTodo: Todo = { id: crypto.randomUUID(), title, completed: false };
    setTodos((currentTodos) => [...currentTodos, newTodo]);
  }

  function toggleTodo(id: string) {
    // mapで対象のTodoだけを更新した、新しい配列を作ります。
    setTodos((currentTodos) =>
      currentTodos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  }

  function deleteTodo(id: string) {
    // filterで削除対象以外のTodoを残します。
    setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
  }

  const remainingCount = todos.filter((todo) => !todo.completed).length;
  const visibleTodos = filterTodos(todos, query, status);

  function resetFilters() {
    setQuery('');
    setStatus('all');
  }

  return (
    <main className="todo-app">
      <header>
        <h1>はじめてのTodo</h1>
      </header>

      <TodoForm onAdd={addTodo} />

      <TodoFilters
        query={query}
        status={status}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />

      <p className="summary" role="status">
        全{todos.length}件・残り{remainingCount}件・表示{visibleTodos.length}件
      </p>

      {todos.length === 0 ? (
        <p className="empty">Todoはまだありません。</p>
      ) : visibleTodos.length === 0 ? (
        <p className="empty">条件に一致するTodoはありません。</p>
      ) : (
        <ul className="todo-list">
          {visibleTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
      {storageError && <p className="note" role="alert">{storageError}</p>}
      <p className="note">チェックすると完了になります。Todoはこのブラウザに保存されます。</p>
    </main>
  );
}
