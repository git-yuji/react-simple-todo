import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Todo } from '../types/todo';

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onEditStart: (id: string) => void;
  onEditEnd: (id: string, title?: string) => void;
  outsideFilters: boolean;
};

// データと操作関数をpropsで受け取り、1件のTodoを表示します。
export default function TodoItem({ todo, onToggle, onDelete, onRename, onEditStart, onEditEnd, outsideFilters }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (wasEditing.current) {
      editButtonRef.current?.focus();
    }
    wasEditing.current = isEditing;
  }, [isEditing]);

  function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = draft.trim();
    if (title === '' || title.length > 200) return;
    if (title !== todo.title) onRename(todo.id, title);
    onEditEnd(todo.id, title);
    setIsEditing(false);
  }

  function cancelEditing() {
    onEditEnd(todo.id);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <li>
        <form
          className="edit-form"
          onSubmit={saveTitle}
          aria-label="Todoを編集"
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
              if (event.key === 'Enter') event.preventDefault();
              return;
            }
            if (event.key === 'Escape') {
              event.preventDefault();
              cancelEditing();
            }
          }}
        >
          <label className="edit-status">
            <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} />
            <span role="status">{todo.completed ? '完了' : '未完了'}</span>
          </label>
          <label htmlFor={`edit-${todo.id}`}>タイトルを編集</label>
          <input
            ref={inputRef}
            id={`edit-${todo.id}`}
            type="text"
            value={draft}
            maxLength={200}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="edit-actions">
            <button type="submit" disabled={draft.trim() === '' || draft.trim().length > 200}>保存</button>
            <button type="button" onClick={cancelEditing}>キャンセル</button>
          </div>
          <p className="edit-hint">Enterで保存・Escでキャンセル（200文字まで）</p>
          {outsideFilters && <p className="edit-hint">条件から外れていますが、編集中のため表示しています。保存・キャンセル後に一覧から消えます。</p>}
        </form>
      </li>
    );
  }

  return (
    <li className={todo.completed ? 'completed' : ''}>
      <label className="todo-label">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggle(todo.id)}
        />
        <span>{todo.title}</span>
      </label>
      <div className="todo-actions">
        <button
          ref={editButtonRef}
          type="button"
          className="edit-button"
          onClick={() => {
            setDraft(todo.title);
            onEditStart(todo.id);
            setIsEditing(true);
          }}
          aria-label={`${todo.title}を編集`}
        >編集</button>
        <button
          type="button"
          className="delete-button"
          onClick={() => onDelete(todo.id)}
          aria-label={`${todo.title}を削除`}
        >削除</button>
      </div>
    </li>
  );
}
