import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { isDueDate } from '../utils/dueDate';

type TodoFormProps = {
  onAdd: (title: string, dueDate: string | null) => void;
};

export default function TodoForm({ onAdd }: TodoFormProps) {
  // 入力文字は、このフォームだけで使う状態です。
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDueDate, setShowDueDate] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showDueDate) dateRef.current?.focus();
  }, [showDueDate]);

  function removeDueDate() {
    // 途中まで入力した日付も消し、閉じた入力欄の検証が追加を妨げないようにします。
    if (dateRef.current) dateRef.current.value = '';
    setDueDate('');
    setShowDueDate(false);
    dateButtonRef.current?.focus();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = text.trim();
    if (title === '' || (dueDate !== '' && !isDueDate(dueDate))) return;

    // propsで受け取った関数で、親のAppにタイトルを渡します。
    onAdd(title, dueDate || null);
    setText('');
    setDueDate('');
    setShowDueDate(false);
    inputRef.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit} className="add-form">
      <label htmlFor="todo-input">新しいTodo</label>
      <div className="input-row">
        <input
          ref={inputRef}
          id="todo-input"
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="やることを入力"
          maxLength={200}
        />
        <button type="submit" disabled={text.trim() === ''}>追加</button>
      </div>
      <button
        ref={dateButtonRef}
        type="button"
        className="date-toggle"
        aria-expanded={showDueDate}
        aria-controls="add-due-date"
        onClick={() => showDueDate ? removeDueDate() : setShowDueDate(true)}
      >{showDueDate ? '期限を外す' : '期限を追加'}</button>
      <div className="due-date-field" id="add-due-date" hidden={!showDueDate}>
        <label htmlFor="new-due-date">期限日（任意）</label>
        <input
          ref={dateRef}
          id="new-due-date"
          type="date"
          disabled={!showDueDate}
          min="0001-01-01"
          max="9999-12-31"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              removeDueDate();
            }
          }}
        />
      </div>
    </form>
  );
}
