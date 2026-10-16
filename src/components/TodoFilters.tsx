import type { TodoDueFilter, TodoSort, TodoStatus } from '../utils/filterTodos';
import type { Ref } from 'react';
import { useRef, useState } from 'react';

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

const dueLabels: Record<TodoDueFilter, string> = {
  all: '期限すべて', 'through-today': '今日まで', overdue: '期限切れ', none: '期限なし',
};

const quickViews: { label: string; status: TodoStatus; due: TodoDueFilter }[] = [
  { label: '未完了', status: 'active', due: 'all' },
  { label: '今日まで', status: 'active', due: 'through-today' },
  { label: 'すべて', status: 'all', due: 'all' },
];

export default function TodoFilters({
  searchInputRef, query, status, dueFilter, sort, onQueryChange, onStatusChange, onDueFilterChange, onSortChange, onReset,
}: TodoFiltersProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const changedSettings = Number(status !== 'all') + Number(dueFilter !== 'all') + Number(sort !== 'added');
  const description = [
    statusOptions.find((option) => option.value === status)?.label,
    dueFilter !== 'all' ? dueLabels[dueFilter] : null,
    sort === 'added' ? '追加順' : '期限が近い順',
  ].filter(Boolean).join('・');

  return (
    <section className="todo-filters" aria-label="Todoの検索・絞り込み">
      <div className="quick-views" role="group" aria-label="よく使う表示">
        {quickViews.map((view) => (
          <button
            key={view.label}
            type="button"
            aria-pressed={status === view.status && dueFilter === view.due}
            onClick={() => {
              onStatusChange(view.status);
              onDueFilterChange(view.due);
            }}
          >{view.label}</button>
        ))}
      </div>

      <div className="search-toolbar">
        <div className="search-field">
          <label className="sr-only" htmlFor="todo-search">Todoを検索</label>
          <input
            ref={searchInputRef}
            id="todo-search"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Todoを検索"
          />
        </div>
        <button
          ref={settingsButtonRef}
          type="button"
          className="view-settings"
          aria-expanded={settingsOpen}
          aria-controls="view-settings-panel"
          onClick={() => setSettingsOpen((open) => !open)}
        >表示設定{changedSettings > 0 && <span className="settings-count" aria-hidden="true">{changedSettings}</span>}</button>
      </div>

      <div
        id="view-settings-panel"
        className="advanced-panel"
        role="region"
        aria-label="詳細な表示条件"
        hidden={!settingsOpen}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setSettingsOpen(false);
            settingsButtonRef.current?.focus();
          }
        }}
      >
        <div className="deadline-filters">
          <div>
            <label htmlFor="status-filter">完了状態</label>
            <select id="status-filter" value={status} onChange={(event) => onStatusChange(event.target.value as TodoStatus)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
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
      </div>

      <div className="filter-summary">
        <p>{description}</p>
        <button
          type="button"
          className="reset-filters"
          disabled={query === '' && status === 'all' && dueFilter === 'all' && sort === 'added'}
          onClick={onReset}
        >条件をリセット</button>
      </div>
    </section>
  );
}
