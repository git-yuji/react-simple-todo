import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'Asia/Tokyo' });

test('期限の並べ替え・絞り込みと編集中の保護を確認する', async ({ page, context }) => {
  await page.clock.install({ time: new Date('2026-10-16T00:30:00+09:00') });
  await page.clock.pauseAt(new Date('2026-10-16T00:31:00+09:00'));
  await page.goto('/');
  const original = [
    { id: 'future', title: 'React 明日', completed: false, dueDate: '2026-10-17' },
    { id: 'none', title: '期限なし', completed: false },
    { id: 'today', title: 'React 今日', completed: false, dueDate: '2026-10-16' },
    { id: 'past', title: 'React 昨日', completed: false, dueDate: '2026-10-15' },
    { id: 'done', title: '完了済み', completed: true, dueDate: '2026-10-14' },
    { id: 'tie', title: '同じ期限', completed: false, dueDate: '2026-10-16' },
  ];
  await page.evaluate((todos) => localStorage.setItem('react-simple-todo.todos', JSON.stringify(todos)), original);
  await page.reload();
  await page.getByRole('button', { name: '表示設定', exact: true }).click();
  const due = page.getByLabel('期限で絞り込み', { exact: true });
  const sort = page.getByLabel('並べ替え', { exact: true });
  const search = page.getByRole('searchbox', { name: 'Todoを検索', exact: true });
  const reset = page.getByRole('button', { name: '条件をリセット', exact: true });
  const editor = page.getByRole('form', { name: 'Todoを編集', exact: true });
  const titles = page.locator('.todo-list .todo-label span');
  const row = (name: string) => page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `${name}を編集`, exact: true }) });
  const edit = (name: string) => page.getByRole('button', { name: `${name}を編集`, exact: true }).click();

  await test.step('期限順・同じ期限の順番・期限なしの位置とリセットを確認する', async () => {
    await expect(titles).toHaveText(original.map((todo) => todo.title));
    await expect(reset).toBeDisabled();
    await sort.selectOption('due-date');
    await expect(titles).toHaveText(['完了済み', 'React 昨日', 'React 今日', '同じ期限', 'React 明日', '期限なし']);
    await expect(reset).toBeEnabled();
    await reset.click();
    await expect(sort).toHaveValue('added');
    await expect(titles).toHaveText(original.map((todo) => todo.title));
    expect(await page.evaluate(() => localStorage.getItem('react-simple-todo.todos'))).toBe(JSON.stringify(original));
  });

  await test.step('検索・完了状態・期限を組み合わせ、件数と空表示を確認する', async () => {
    await due.selectOption('through-today');
    await expect(titles).toHaveText(['React 今日', 'React 昨日', '同じ期限']);
    await expect(page.getByRole('status')).toHaveText('全6件・残り5件・表示3件');
    await search.fill('  REACT  ');
    await sort.selectOption('due-date');
    await expect(titles).toHaveText(['React 昨日', 'React 今日']);
    await page.getByLabel('完了状態', { exact: true }).selectOption('completed');
    await expect(page.getByText('条件に一致するTodoはありません。', { exact: true })).toBeVisible();
    await reset.click();
    await due.selectOption('none');
    await expect(titles).toHaveText(['期限なし']);
    await due.selectOption('overdue');
    await expect(titles).toHaveText(['React 昨日']);
    await reset.click();
    await expect(due).toHaveValue('all');
    await expect(search).toHaveValue('');
    await expect(sort).toHaveValue('added');
  });

  await test.step('期限を変更して条件から外れると検索欄へフォーカスを戻す', async () => {
    await due.selectOption('overdue');
    await edit('React 昨日');
    await editor.getByLabel('期限日（任意）', { exact: true }).fill('2026-10-18');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(search).toBeFocused();
    await expect(page.getByText('条件に一致するTodoはありません。', { exact: true })).toBeVisible();
    await due.selectOption('none');
    await edit('期限なし');
    await editor.getByLabel('期限日（任意）', { exact: true }).fill('2026-10-16');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(search).toBeFocused();
    await expect(editor).toHaveCount(0);
    await reset.click();
  });

  const other = await context.newPage();
  await other.goto('/');
  const otherEditor = other.getByRole('form', { name: 'Todoを編集', exact: true });
  await test.step('別タブの期限変更で条件から外れても編集中の入力を保持する', async () => {
    await due.selectOption('through-today');
    await edit('React 今日');
    await editor.getByLabel('タイトルを編集', { exact: true }).fill('入力を保持');
    await other.getByRole('button', { name: 'React 今日を編集', exact: true }).click();
    await otherEditor.getByLabel('期限日（任意）', { exact: true }).fill('2026-10-19');
    await other.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor.getByText('条件から外れていますが、', { exact: false })).toBeVisible();
    await expect(editor.getByLabel('タイトルを編集', { exact: true })).toHaveValue('入力を保持');
    await editor.getByRole('button', { name: 'キャンセル', exact: true }).click();
    await expect(search).toBeFocused();
    await expect(row('React 今日')).toHaveCount(0);
    await reset.click();
  });

  await test.step('並べ替え中の別タブ更新と条件変更で入力を破棄しない', async () => {
    await sort.selectOption('due-date');
    await edit('React 明日');
    await editor.getByLabel('タイトルを編集', { exact: true }).fill('移動しても保持');
    await other.getByRole('button', { name: 'React 明日を編集', exact: true }).click();
    await otherEditor.getByLabel('期限日（任意）', { exact: true }).fill('2026-10-13');
    await other.getByRole('button', { name: '保存', exact: true }).click();
    await expect(page.getByRole('listitem').first().getByRole('form')).toBeVisible();
    await expect(editor.getByLabel('タイトルを編集', { exact: true })).toHaveValue('移動しても保持');
    await due.selectOption('none');
    await expect(editor.getByLabel('タイトルを編集', { exact: true })).toHaveValue('移動しても保持');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(search).toBeFocused();
    await reset.click();
    await expect(row('移動しても保持')).toBeVisible();
  });

  await test.step('日付をまたぐと期限の絞り込みも再計算する', async () => {
    await due.selectOption('overdue');
    await expect(titles).toHaveText(['移動しても保持']);
    await page.clock.fastForward(24 * 60 * 60 * 1000);
    await expect(titles).toHaveText(['移動しても保持', '期限なし', '同じ期限']);
    await reset.click();
  });

  await test.step('PC・スマホ表示と再読み込み後の初期条件を確認する', async () => {
    await sort.selectOption('due-date');
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.screenshot({ path: 'screenshots/due-filters-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(due).toBeVisible();
    await expect(sort).toBeVisible();
    await page.screenshot({ path: 'screenshots/due-filters-mobile.png', fullPage: true });
    await page.reload();
    await expect(sort).toHaveValue('added');
    await expect(due).toHaveValue('all');
    await expect(titles).toHaveText(['移動しても保持', '期限なし', 'React 今日', 'React 昨日', '完了済み', '同じ期限']);
  });
});
