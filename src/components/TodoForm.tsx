import { useState } from 'react';
import type { FormEvent } from 'react';

type TodoFormProps = {
  onAdd: (title: string) => void;
};

export default function TodoForm({ onAdd }: TodoFormProps) {
  // 入力文字は、このフォームだけで使う状態です。
  const [text, setText] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = text.trim();
    if (title === '') return;

    // propsで受け取った関数で、親のAppにタイトルを渡します。
    onAdd(title);
    setText('');
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
    </form>
  );
}
