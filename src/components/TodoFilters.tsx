import type { TodoDueFilter, TodoSort, TodoStatus } from '../utils/filterTodos';
import type { Ref } from 'react';

type TodoFiltersProps = {
  searchInputRef: Ref<HTMLInputElement>;
  query: string;
  status: TodoStatus;
  dueFilter: TodoDueFilter;
  sort: TodoSort;
  onQueryChange: (query: string) => void;
  onStatusChange: (status: TodoStatus) => void;
  onDueFilterChange: (filter: TodoDueFilter) => void;
  onSortChange: (sort: TodoSort) => void;
  onReset: () => void;
};

const statusOptions: { value: TodoStatus; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'active', label: '未完了' },
  { value: 'completed', label: '完了' },
];

export default function TodoFilters({
  searchInputRef, query, status, dueFilter, sort, onQueryChange, onStatusChange, onDueFilterChange, onSortChange, onReset,
}: TodoFiltersProps) {
  return (
    <section className="todo-filters" aria-label="Todoの検索・絞り込み">
      <label htmlFor="todo-search">Todoを検索</label>
      <input
        ref={searchInputRef}
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
          disabled={query === '' && status === 'all' && dueFilter === 'all' && sort === 'added'}
          onClick={onReset}
        >条件をリセット</button>
      </div>
      <div className="deadline-filters">
        <div>
          <label htmlFor="due-filter">期限で絞り込み</label>
          <select id="due-filter" value={dueFilter} onChange={(event) => onDueFilterChange(event.target.value as TodoDueFilter)} aria-describedby="due-filter-hint">
            <option value="all">すべて</option>
            <option value="through-today">今日まで</option>
            <option value="overdue">期限切れ</option>
            <option value="none">期限なし</option>
          </select>
        </div>
        <div>
          <label htmlFor="todo-sort">並べ替え</label>
          <select id="todo-sort" value={sort} onChange={(event) => onSortChange(event.target.value as TodoSort)}>
            <option value="added">追加順</option>
            <option value="due-date">期限が近い順</option>
          </select>
        </div>
      </div>
      <p className="edit-hint" id="due-filter-hint">「今日まで」は未完了で期限が今日以前、「期限切れ」は未完了で期限が昨日以前のTodoです。</p>
    </section>
  );
}
