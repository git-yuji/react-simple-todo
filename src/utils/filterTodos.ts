import type { Todo } from '../types/todo';

export type TodoStatus = 'all' | 'active' | 'completed';

// 元のTodo一覧は変更せず、検索と完了状態の両方に合うTodoを返します。
export function filterTodos(todos: Todo[], query: string, status: TodoStatus): Todo[] {
  const keyword = query.trim().toLowerCase();
  return todos.filter((todo) => {
    const matchesTitle = todo.title.toLowerCase().includes(keyword);
    const matchesStatus = status === 'all'
      || (status === 'active' && !todo.completed)
      || (status === 'completed' && todo.completed);
    return matchesTitle && matchesStatus;
  });
}
