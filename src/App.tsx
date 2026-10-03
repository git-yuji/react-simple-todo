import { useState } from 'react';
import type { FormEvent } from 'react';

// Todoに必要なデータと、それぞれの型を定義します。
type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export default function App() {
  // state（状態）が変わると、Reactが画面を更新します。
  const [text, setText] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // フォーム送信によるページの再読み込みを防ぐ
    const title = text.trim();
    if (title === '') return;

    const newTodo: Todo = { id: crypto.randomUUID(), title, completed: false };
    setTodos((currentTodos) => [...currentTodos, newTodo]);
    setText('');
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

      <form onSubmit={addTodo} className="add-form">
        <label htmlFor="todo-input">新しいTodo</label>
        <div className="input-row">
          <input
            id="todo-input"
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="例：Reactの勉強をする"
            maxLength={200}
          />
          <button type="submit" disabled={text.trim() === ''}>追加</button>
        </div>
      </form>

      <p className="summary" role="status">
        全{todos.length}件・残り{remainingCount}件
      </p>

      {todos.length === 0 ? (
        <p className="empty">Todoはまだありません。</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? 'completed' : ''}>
              <label className="todo-label">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span>{todo.title}</span>
              </label>
              <button
                type="button"
                className="delete-button"
                onClick={() => deleteTodo(todo.id)}
                aria-label={`${todo.title}を削除`}
              >削除</button>
            </li>
          ))}
        </ul>
      )}
      <p className="note">チェックすると完了になります。再読み込みするとTodoは消えます。</p>
    </main>
  );
}
