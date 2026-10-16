import { useEffect, useRef, useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import TodoFilters from './components/TodoFilters';
import type { Todo } from './types/todo';
import { filterTodos, sortTodos } from './utils/filterTodos';
import type { TodoDueFilter, TodoSort, TodoStatus } from './utils/filterTodos';
import { useStoredTodos } from './hooks/useStoredTodos';
import { useToday } from './hooks/useToday';

export default function App() {
  // state（状態）が変わると、Reactが画面を更新します。
  const { todos, storageError, changeTodo, toggleTodo } = useStoredTodos();
  const today = useToday();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<TodoStatus>('all');
  const [dueFilter, setDueFilter] = useState<TodoDueFilter>('all');
  const [sort, setSort] = useState<TodoSort>('added');
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

  function finishEditing(id: string, title?: string, dueDate?: string | null) {
    const todo = todos.find((item) => item.id === id);
    // 保存・キャンセル後に行が消える場合は、残る検索欄へフォーカスを戻します。
    const updatedTodo = todo && { ...todo, title: title ?? todo.title, dueDate: dueDate === undefined ? todo.dueDate : dueDate };
    if (!updatedTodo || filterTodos([updatedTodo], query, status, dueFilter, today).length === 0) {
      searchInputRef.current?.focus();
    }
    setEditingIds((ids) => ids.filter((editingId) => editingId !== id));
  }

  function addTodo(title: string, dueDate: string | null) {
    const newTodo: Todo = { id: crypto.randomUUID(), title, completed: false, dueDate };
    changeTodo({ type: 'add', todo: newTodo });
  }

  function deleteTodo(id: string) {
    changeTodo({ type: 'delete', id });
  }

  function renameTodo(id: string, title: string) {
    changeTodo({ type: 'rename', id, title });
  }

  function setDueDate(id: string, dueDate: string | null) {
    changeTodo({ type: 'set-due-date', id, dueDate });
  }

  const remainingCount = todos.filter((todo) => !todo.completed).length;
  const matchingTodos = filterTodos(todos, query, status, dueFilter, today);
  const matchingIds = new Set(matchingTodos.map((todo) => todo.id));
  // 条件から外れても、編集中の行は保存・キャンセルまで表示を続けます。
  const visibleTodos = sortTodos(todos.filter((todo) => matchingIds.has(todo.id) || editingIds.includes(todo.id)), sort);

  function resetFilters() {
    setQuery('');
    setStatus('all');
    setDueFilter('all');
    setSort('added');
  }

  return (
    <main className="todo-app">
      <header className="app-header">
        <h1>やることリスト</h1>
        <p className="description">今日のやることを、ひとつずつ。</p>
      </header>

      <TodoForm onAdd={addTodo} />
      {storageError && <p className="note" role="alert">{storageError}</p>}

      <TodoFilters
        searchInputRef={searchInputRef}
        query={query}
        status={status}
        dueFilter={dueFilter}
        sort={sort}
        onQueryChange={setQuery}
        onStatusChange={setStatus}
        onDueFilterChange={setDueFilter}
        onSortChange={setSort}
        onReset={resetFilters}
      />

      <div className="list-heading">
        <h2>Todo一覧</h2>
        <p className="summary" role="status">
          全{todos.length}件・残り{remainingCount}件・表示{visibleTodos.length}件
        </p>
      </div>

      {todos.length === 0 ? (
        <div className="empty">
          <p>Todoはまだありません。</p>
          <p className="empty-hint">上の入力欄から、最初のやることを追加しましょう。</p>
        </div>
      ) : visibleTodos.length === 0 ? (
        <div className="empty">
          <p>条件に一致するTodoはありません。</p>
          <button type="button" className="empty-reset" onClick={() => {
            resetFilters();
            searchInputRef.current?.focus();
          }}>すべてのTodoを表示</button>
        </div>
      ) : (
        <ul className="todo-list">
          {visibleTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onRename={renameTodo}
              onSetDueDate={setDueDate}
              today={today}
              onEditStart={startEditing}
              onEditEnd={finishEditing}
              outsideFilters={!matchingIds.has(todo.id)}
            />
          ))}
        </ul>
      )}
      <p className="note">{storageError ? '保存に問題があります。上の案内をご確認ください。' : 'Todoはこのブラウザに自動保存されます。'}</p>
    </main>
  );
}
