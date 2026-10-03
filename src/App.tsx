import { useState } from 'react';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import type { Todo } from './types/todo';

export default function App() {
  // state（状態）が変わると、Reactが画面を更新します。
  const [todos, setTodos] = useState<Todo[]>([]);

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

  return (
    <main className="todo-app">
      <header>
        <h1>はじめてのTodo</h1>
      </header>

      <TodoForm onAdd={addTodo} />

      <p className="summary" role="status">
        全{todos.length}件・残り{remainingCount}件
      </p>

      {todos.length === 0 ? (
        <p className="empty">Todoはまだありません。</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </ul>
      )}
      <p className="note">チェックすると完了になります。再読み込みするとTodoは消えます。</p>
    </main>
  );
}
