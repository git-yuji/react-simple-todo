import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { loadTodos, TODO_STORAGE_KEY, updateStoredTodos } from '../src/utils/todoStorage.ts';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
let data;

beforeEach(() => {
  data = new Map();
  let queue = Promise.resolve();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
    },
  } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    locks: {
      request: (_key, callback) => {
        const result = queue.then(callback);
        queue = result.catch(() => {});
        return result;
      },
    },
  } });
});

afterEach(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else delete globalThis.window;
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else delete globalThis.navigator;
});

const todo = (id) => ({ id, title: id, completed: false });

test('stale tabs keep both additions by reading within the lock', async () => {
  await Promise.all([
    updateStoredTodos([{ type: 'add', todo: todo('A') }], []),
    updateStoredTodos([{ type: 'add', todo: todo('B') }], []),
  ]);
  assert.deepEqual(loadTodos().todos.map((item) => item.id), ['A', 'B']);
});

test('concurrent completion intents do not toggle twice', async () => {
  data.set(TODO_STORAGE_KEY, JSON.stringify([todo('A')]));
  const change = { type: 'set-completed', id: 'A', completed: true };
  await Promise.all([updateStoredTodos([change], []), updateStoredTodos([change], [])]);
  assert.equal(loadTodos().todos[0].completed, true);
  await updateStoredTodos([{ ...change, completed: false }], []);
  assert.equal(loadTodos().todos[0].completed, false);
});

test('deletion wins against completion in either order', async () => {
  const changes = [
    { type: 'delete', id: 'A' },
    { type: 'set-completed', id: 'A', completed: true },
  ];
  for (const ordered of [changes, [...changes].reverse()]) {
    data.set(TODO_STORAGE_KEY, JSON.stringify([todo('A')]));
    await Promise.all(ordered.map((change) => updateStoredTodos([change], [todo('A')])));
    assert.deepEqual(loadTodos().todos, []);
  }
});

test('unsupported locks never write a stale snapshot', async () => {
  navigator.locks = undefined;
  data.set(TODO_STORAGE_KEY, JSON.stringify([todo('A')]));
  const result = await updateStoredTodos([{ type: 'add', todo: todo('B') }], []);
  assert.ok(result.error);
  assert.deepEqual(result.todos, [todo('B')]);
  assert.deepEqual(loadTodos().todos, [todo('A')]);
});

test('failed changes can be retried alongside another tab’s updates', async () => {
  const pending = [{ type: 'add', todo: todo('A') }];
  const setItem = window.localStorage.setItem;
  window.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  const failed = await updateStoredTodos(pending, []);
  assert.ok(failed.error);
  assert.deepEqual(failed.todos, [todo('A')]);
  window.localStorage.setItem = setItem;
  data.set(TODO_STORAGE_KEY, JSON.stringify([todo('B')]));
  const result = await updateStoredTodos([...pending, { type: 'add', todo: todo('C') }], failed.todos);
  assert.equal(result.error, null);
  assert.deepEqual(loadTodos().todos.map((item) => item.id), ['B', 'A', 'C']);
});

test('invalid data is preserved until an edit successfully recovers it', async () => {
  data.set(TODO_STORAGE_KEY, '{broken');
  assert.ok(loadTodos().error);
  assert.equal(data.get(TODO_STORAGE_KEY), '{broken');
  await updateStoredTodos([{ type: 'add', todo: todo('A') }], []);
  assert.deepEqual(loadTodos().todos, [todo('A')]);
});
