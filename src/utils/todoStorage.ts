import type { Todo } from '../types/todo';

export const TODO_STORAGE_KEY = 'react-simple-todo.todos';

type LoadResult = {
  todos: Todo[];
  error: string | null;
};

export type TodoChange =
  | { type: 'add'; todo: Todo }
  | { type: 'set-completed'; id: string; completed: boolean }
  | { type: 'delete'; id: string };

export function applyTodoChange(todos: Todo[], change: TodoChange): Todo[] {
  switch (change.type) {
    case 'add':
      return todos.some((todo) => todo.id === change.todo.id)
        ? todos : [...todos, change.todo];
    case 'set-completed':
      return todos.map((todo) => todo.id === change.id
        ? { ...todo, completed: change.completed } : todo);
    case 'delete':
      return todos.filter((todo) => todo.id !== change.id);
  }
}

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && typeof value.id === 'string' && value.id.trim() !== ''
    && 'title' in value && typeof value.title === 'string' && value.title.trim() !== ''
    && 'completed' in value && typeof value.completed === 'boolean';
}

export function loadTodos(): LoadResult {
  try {
    const saved = window.localStorage.getItem(TODO_STORAGE_KEY);
    if (saved === null) return { todos: [], error: null };

    // JSON.parseの結果は型が保証されないため、実際のデータを確認します。
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed) || !parsed.every(isTodo)
      || new Set(parsed.map((todo) => todo.id)).size !== parsed.length) {
      throw new Error('保存データの形式が正しくありません。');
    }
    return { todos: parsed, error: null };
  } catch {
    return {
      todos: [],
      error: '保存済みのTodoを読み込めませんでした。空の一覧で開始します。',
    };
  }
}

function saveTodos(todos: Todo[]): string | null {
  try {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
    return null;
  } catch {
    return 'Todoを保存できませんでした。再読み込みすると変更が失われます。';
  }
}

export async function updateStoredTodos(changes: TodoChange[], fallback: Todo[]): Promise<LoadResult> {
  const applyChanges = (todos: Todo[]) => changes.reduce(applyTodoChange, todos);
  const unsavedTodos = applyChanges(fallback);
  if (!navigator.locks) {
    // ロックなしの読み取り→保存は、他タブの変更を上書きするため行いません。
    return {
      todos: unsavedTodos,
      error: 'このブラウザでは安全な保存を利用できません。再読み込みすると変更が失われます。',
    };
  }
  try {
    return await navigator.locks.request(TODO_STORAGE_KEY, () => {
      // 同じオリジンの全タブで、最新データへの変更と保存を順番に行います。
      const latest = loadTodos();
      const todos = applyChanges(latest.error ? fallback : latest.todos);
      const error = saveTodos(todos);
      return { todos, error };
    });
  } catch {
    return {
      todos: unsavedTodos,
      error: 'Todoを保存できませんでした。再読み込みすると変更が失われます。',
    };
  }
}
