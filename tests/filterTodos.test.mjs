import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterTodos, sortTodos } from '../src/utils/filterTodos.ts';

const today = '2026-10-16';
const todos = Object.freeze([
  { id: 'future', title: 'React 明日', completed: false, dueDate: '2026-10-17' },
  { id: 'legacy', title: '買い物', completed: false },
  { id: 'today', title: 'React 今日', completed: false, dueDate: today },
  { id: 'overdue', title: 'REACT 昨日', completed: false, dueDate: '2026-10-15' },
  { id: 'done', title: 'React 完了', completed: true, dueDate: '2026-10-14' },
  { id: 'tie', title: '買い物 今日', completed: false, dueDate: today },
  { id: 'none-done', title: '完了 期限なし', completed: true, dueDate: null },
  { id: 'today-done', title: 'React 今日 完了', completed: true, dueDate: today },
  { id: 'last', title: '遠い未来', completed: false, dueDate: '9999-12-31' },
].map(Object.freeze));
const ids = (items) => items.map((todo) => todo.id);
const filter = (dueFilter, status = 'all', query = '') => filterTodos(todos, query, status, dueFilter, today);

test('今日まで・期限切れは未完了のみを対象にし、期限なしは旧データも含む', () => {
  assert.deepEqual(ids(filter('all')), ids(todos));
  assert.deepEqual(ids(filter('through-today')), ['today', 'overdue', 'tie']);
  assert.deepEqual(ids(filter('overdue')), ['overdue']);
  assert.deepEqual(ids(filter('none')), ['legacy', 'none-done']);
  assert.deepEqual(filter('through-today', 'completed'), []);
  assert.deepEqual(filter('overdue', 'completed'), []);
  assert.deepEqual(ids(filter('none', 'completed')), ['none-done']);
});

test('検索・完了状態・期限のすべてを組み合わせ、元のデータを変えない', () => {
  const original = JSON.stringify(todos);
  assert.deepEqual(ids(filter('through-today', 'active', '  rEaCt  ')), ['today', 'overdue']);
  assert.deepEqual(ids(filter('all', 'completed', 'react')), ['done', 'today-done']);
  assert.deepEqual(filter('none', 'active', 'React'), []);
  assert.deepEqual(filter('all', 'all', '見つからない'), []);
  assert.equal(JSON.stringify(todos), original);
});

test('期限順は過去から未来、期限なしは最後で、同じ期限は追加順を保つ', () => {
  const original = JSON.stringify(todos);
  assert.deepEqual(ids(sortTodos(todos, 'due-date')), [
    'done', 'overdue', 'today', 'tie', 'today-done', 'future', 'last', 'legacy', 'none-done',
  ]);
  assert.deepEqual(ids(sortTodos(todos, 'added')), ids(todos));
  assert.equal(JSON.stringify(todos), original);
  assert.notEqual(sortTodos(todos, 'added'), todos);
});

test('日付をまたぐと期限の条件も更新し、空の一覧も処理できる', () => {
  assert.deepEqual(ids(filterTodos(todos, '', 'all', 'overdue', '2026-10-17')), ['today', 'overdue', 'tie']);
  assert.deepEqual(ids(filterTodos(todos, '', 'all', 'through-today', '2026-10-17')), ['future', 'today', 'overdue', 'tie']);
  assert.deepEqual(sortTodos([], 'due-date'), []);
  assert.deepEqual(filterTodos([], '', 'all', 'none', today), []);
});
