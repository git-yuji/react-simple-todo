import type { Todo } from '../types/todo';

type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

// データと操作関数をpropsで受け取り、1件のTodoを表示します。
export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
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
      <button
        type="button"
        className="delete-button"
        onClick={() => onDelete(todo.id)}
        aria-label={`${todo.title}を削除`}
      >削除</button>
    </li>
  );
}
