import { useState } from 'react';
import type { FormEvent } from 'react';
import { isDueDate } from '../utils/dueDate';

type TodoFormProps = {
  onAdd: (title: string, dueDate: string | null) => void;
};

export default function TodoForm({ onAdd }: TodoFormProps) {
  // 入力文字は、このフォームだけで使う状態です。
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = text.trim();
    if (title === '' || (dueDate !== '' && !isDueDate(dueDate))) return;

    // propsで受け取った関数で、親のAppにタイトルを渡します。
    onAdd(title, dueDate || null);
    setText('');
    setDueDate('');
  }

  return (
    <form onSubmit={handleSubmit} className="add-form">
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
      <div className="due-date-field">
        <label htmlFor="new-due-date">期限日（任意）</label>
        <input id="new-due-date" type="date" min="0001-01-01" max="9999-12-31" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </div>
    </form>
  );
}
