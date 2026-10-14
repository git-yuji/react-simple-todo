import { useEffect, useRef, useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import TodoFilters from './components/TodoFilters';
import type { Todo } from './types/todo';
import { filterTodos } from './utils/filterTodos';
import type { TodoStatus } from './utils/filterTodos';
import { useStoredTodos } from './hooks/useStoredTodos';

export default function App() {
  // state（状態）が変わると、Reactが画面を更新します。
  const { todos, storageError, changeTodo, toggleTodo } = useStoredTodos();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TodoStatus>('all');
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 別タブで削除されたTodoの編集情報も片付けます。
    setEditingIds((ids) => ids.some((id) => !todos.some((todo) => todo.id === id))
      ? ids.filter((id) => todos.some((todo) => todo.id === id)) : ids);
  }, [todos]);

  function startEditing(id: string) {
    setEditingIds((ids) => ids.includes(id) ? ids : [...ids, id]);
  }

  function finishEditing(id: string, title?: string) {
    const todo = todos.find((item) => item.id === id);
    // 保存・キャンセル後に行が消える場合は、残る検索欄へフォーカスを戻します。
    if (!todo || filterTodos([{ ...todo, title: title ?? todo.title }], query, status).length === 0) {
      searchInputRef.current?.focus();
    }
    setEditingIds((ids) => ids.filter((editingId) => editingId !== id));
  }

  function addTodo(title: string) {
    const newTodo: Todo = { id: crypto.randomUUID(), title, completed: false };
    changeTodo({ type: 'add', todo: newTodo });
  }

  function deleteTodo(id: string) {
    changeTodo({ type: 'delete', id });
  }

  function renameTodo(id: string, title: string) {
    changeTodo({ type: 'rename', id, title });
  }

  const remainingCount = todos.filter((todo) => !todo.completed).length;
  const matchingTodos = filterTodos(todos, query, status);
  const matchingIds = new Set(matchingTodos.map((todo) => todo.id));
  // 条件から外れても、編集中の行は保存・キャンセルまで同じ位置に残します。
  const visibleTodos = todos.filter((todo) => matchingIds.has(todo.id) || editingIds.includes(todo.id));

  function resetFilters() {
    setQuery('');
    setStatus('all');
  }

  return (
    <main className="todo-app">
      <header className="app-header">
        <p className="eyebrow">MY TODO</p>
        <h1>やることリスト</h1>
        <p className="description">今日のやることを、ひとつずつ。</p>
      </header>

      <TodoForm onAdd={addTodo} />

      <TodoFilters
        searchInputRef={searchInputRef}
        query={query}
        status={status}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onReset={resetFilters}
      />

      <div className="list-heading">
        <h2>Todo一覧</h2>
        <p className="summary" role="status">
          全{todos.length}件・残り{remainingCount}件・表示{visibleTodos.length}件
        </p>
      </div>

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
              onRename={renameTodo}
              onEditStart={startEditing}
              onEditEnd={finishEditing}
              outsideFilters={!matchingIds.has(todo.id)}
            />
          ))}
        </ul>
      )}
      {storageError && <p className="note" role="alert">{storageError}</p>}
      <p className="note">チェックすると完了になります。Todoはこのブラウザに保存されます。</p>
    </main>
  );
}
