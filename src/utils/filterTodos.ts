import type { Todo } from '../types/todo';

export type TodoStatus = 'all' | 'active' | 'completed';
export type TodoDueFilter = 'all' | 'through-today' | 'overdue' | 'none';
export type TodoSort = 'added' | 'due-date';

// 検索・完了状態・期限のすべてに合うTodoを返します。
export function filterTodos(todos: Todo[], query: string, status: TodoStatus, dueFilter: TodoDueFilter, today: string): Todo[] {
  const keyword = query.trim().toLowerCase();
  return todos.filter((todo) => {
    const matchesTitle = todo.title.toLowerCase().includes(keyword);
    const matchesStatus = status === 'all'
      || (status === 'active' && !todo.completed)
      || (status === 'completed' && todo.completed);
    const matchesDueDate = dueFilter === 'all'
      || (dueFilter === 'none' && !todo.dueDate)
      || (dueFilter === 'through-today' && !todo.completed && !!todo.dueDate && todo.dueDate <= today)
      || (dueFilter === 'overdue' && !todo.completed && !!todo.dueDate && todo.dueDate < today);
    return matchesTitle && matchesStatus && matchesDueDate;
  });
}

export function sortTodos(todos: Todo[], sort: TodoSort): Todo[] {
  // 同じ期限・期限なし同士は元の追加順を維持します。保存用の配列は変更しません。
  return sort === 'added' ? [...todos] : [...todos].sort((left, right) => {
    if (!left.dueDate && !right.dueDate) return 0;
    if (!left.dueDate) return 1;
    if (!right.dueDate) return -1;
    return left.dueDate < right.dueDate ? -1 : left.dueDate > right.dueDate ? 1 : 0;
  });
}
