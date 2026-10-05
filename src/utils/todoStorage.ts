import type { Todo } from '../types/todo';

export const TODO_STORAGE_KEY = 'react-simple-todo.todos';

type LoadResult = {
  todos: Todo[];
  error: string | null;
};

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

export function saveTodos(todos: Todo[]): string | null {
  try {
    window.localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
    return null;
  } catch {
    return 'Todoを保存できませんでした。再読み込みすると変更が失われます。';
  }
}
