import type { TodoStatus } from '../utils/filterTodos';

type TodoFiltersProps = {
  query: string;
  status: TodoStatus;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: TodoStatus) => void;
  onReset: () => void;
};

const statusOptions: { value: TodoStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'completed', label: '完了' },
];

export default function TodoFilters({
  query, status, onQueryChange, onStatusChange, onReset,
}: TodoFiltersProps) {
  return (
    <section className="todo-filters" aria-label="Todoの検索・絞り込み">
      <label htmlFor="todo-search">Todoを検索</label>
      <input
        id="todo-search"
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="タイトルで検索"
      />
      <div className="filter-row">
        <div className="status-filters" role="group" aria-label="完了状態で絞り込み">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => onStatusChange(option.value)}
            >{option.label}</button>
          ))}
        </div>
        <button
          type="button"
          className="reset-filters"
          disabled={query === '' && status === 'all'}
          onClick={onReset}
        >条件をリセット</button>
      </div>
    </section>
  );
}
