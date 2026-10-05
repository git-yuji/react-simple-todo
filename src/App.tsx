import { useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import TodoFilters from './components/TodoFilters';
import type { Todo } from './types/todo';
import { filterTodos } from './utils/filterTodos';
import type { TodoStatus } from './utils/filterTodos';
import { useStoredTodos } from './hooks/useStoredTodos';

export default function App() {
  // state（状態）が変わると、Reactが画面を更新します。
  const { todos, storageError, changeTodo } = useStoredTodos();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TodoStatus>('all');

  function addTodo(title: string) {
    const newTodo: Todo = { id: crypto.randomUUID(), title, completed: false };
    changeTodo({ type: 'add', todo: newTodo });
  }

  function toggleTodo(id: string) {
    const todo = todos.find((item) => item.id === id);
    if (todo) changeTodo({ type: 'set-completed', id, completed: !todo.completed });
  }

  function deleteTodo(id: string) {
    changeTodo({ type: 'delete', id });
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
