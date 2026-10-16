// AppとTodoItemで共有するTodoの型です。
export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  // 既存データは未設定のまま読み込めます。nullは期限の解除を表します。
  dueDate?: string | null;
};
