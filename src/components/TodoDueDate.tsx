import { dueDateState } from '../utils/dueDate';

type TodoDueDateProps = {
  dueDate?: string | null;
  completed: boolean;
  today: string;
};

export default function TodoDueDate({ dueDate, completed, today }: TodoDueDateProps) {
  const state = dueDateState(dueDate, completed, today);
  return (
    <p className={`due-date due-${state}`}>
      {dueDate ? <>
        期限：<time dateTime={dueDate}>{dueDate.replaceAll('-', '/')}</time>
        {state === 'overdue' && <span>・期限切れ</span>}
        {state === 'today' && <span>・今日まで</span>}
      </> : '期限なし'}
    </p>
  );
}
