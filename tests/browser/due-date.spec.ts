import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'Asia/Tokyo' });

test('期限日の保存・解除・同期と現地日付での表示を確認する', async ({ page, context }) => {
  await page.clock.install({ time: new Date('2026-10-16T00:30:00+09:00') });
  await page.clock.pauseAt(new Date('2026-10-16T00:31:00+09:00'));
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('react-simple-todo.todos', JSON.stringify([
    { id: 'legacy', title: '既存のTodo', completed: false },
  ])));
  await page.reload();
  const editor = page.getByRole('form', { name: 'Todoを編集', exact: true });
  const date = editor.getByLabel('期限日（任意）', { exact: true });
  const title = editor.getByLabel('タイトルを編集', { exact: true });
  const row = (name: string) => page.getByRole('listitem').filter({ has: page.getByRole('button', { name: `${name}を編集`, exact: true }) });
  const edit = (name: string) => page.getByRole('button', { name: `${name}を編集`, exact: true }).click();
  async function save() {
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor).toHaveCount(0);
  }

  await test.step('期限なしの既存データと、今日・過去・未来の期限を表示する', async () => {
    await expect(row('既存のTodo').locator('.due-date')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    for (const [name, dueDate] of [['今日', '2026-10-16'], ['昨日', '2026-10-15'], ['明日', '2026-10-17']]) {
      await page.getByLabel('新しいTodo', { exact: true }).fill(name);
      await page.getByRole('button', { name: '期限を追加', exact: true }).click();
      await page.locator('#new-due-date').fill(dueDate);
      await page.getByRole('button', { name: '追加', exact: true }).click();
      await expect(page.locator('#new-due-date')).toHaveValue('');
    }
    await expect(row('今日').locator('.due-date')).toHaveText('期限：2026/10/16・今日まで');
    await expect(row('昨日').locator('.due-date')).toHaveText('期限：2026/10/15・期限切れ');
    await expect(row('明日').locator('.due-date')).toHaveText('期限：2026/10/17');
    await row('昨日').getByRole('checkbox').check();
    await expect(row('昨日').locator('.due-date')).toHaveText('期限：2026/10/15');
    await row('昨日').getByRole('checkbox').uncheck();
    await expect(row('昨日').locator('.due-overdue')).toBeVisible();
  });

  await test.step('期限の設定・変更・解除・キャンセルと再読み込みを確認する', async () => {
    await edit('既存のTodo');
    await date.fill('2026-10-16');
    await save();
    await page.reload();
    await expect(row('既存のTodo').locator('.due-today')).toBeVisible();
    await edit('既存のTodo');
    await date.fill('2026-10-17');
    await save();
    await expect(row('既存のTodo').locator('.due-date')).toHaveText('期限：2026/10/17');
    await edit('既存のTodo');
    await editor.getByRole('button', { name: '期限を解除', exact: true }).click();
    await date.press('Escape');
    await expect(row('既存のTodo').locator('.due-date')).toHaveText('期限：2026/10/17');
    await edit('既存のTodo');
    await editor.getByRole('button', { name: '期限を解除', exact: true }).click();
    await save();
    await page.reload();
    await expect(row('既存のTodo').locator('.due-date')).toHaveCount(0);
  });

  const other = await context.newPage();
  await other.goto('/');
  const otherEditor = other.getByRole('form', { name: 'Todoを編集', exact: true });
  const editOther = (name: string) => other.getByRole('button', { name: `${name}を編集`, exact: true }).click();

  await test.step('触っていない期限は別タブの最新値を使い、入力中のタイトルを守る', async () => {
    await edit('既存のTodo');
    await title.fill('更新したTodo');
    await editOther('既存のTodo');
    await otherEditor.getByLabel('期限日（任意）', { exact: true }).fill('2026-10-18');
    await otherEditor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(date).toHaveValue('2026-10-18');
    await expect(title).toHaveValue('更新したTodo');
    await save();
    await expect(row('更新したTodo').locator('.due-date')).toHaveText('期限：2026/10/18');
    await expect(other.getByRole('button', { name: '更新したTodoを編集', exact: true })).toBeVisible();
  });

  await test.step('期限だけの編集で別タブのタイトル・完了状態を上書きしない', async () => {
    await edit('更新したTodo');
    await date.fill('2026-10-19');
    await editOther('更新したTodo');
    await otherEditor.getByLabel('タイトルを編集', { exact: true }).fill('別タブで改名');
    await otherEditor.getByRole('button', { name: '保存', exact: true }).click();
    await other.getByRole('listitem').filter({ hasText: '別タブで改名' }).getByRole('checkbox').check();
    await expect(title).toHaveValue('別タブで改名');
    await expect(editor.getByRole('checkbox')).toBeChecked();
    await expect(date).toHaveValue('2026-10-19');
    await save();
    await expect(row('別タブで改名').locator('.due-date')).toHaveText('期限：2026/10/19');
    await other.reload();
    await expect(other.getByRole('listitem').filter({ hasText: '別タブで改名' }).locator('.due-date')).toHaveText('期限：2026/10/19');
  });

  await test.step('入力中の期限を別タブの変更で上書きしない', async () => {
    await edit('別タブで改名');
    await date.fill('2026-10-20');
    await editOther('別タブで改名');
    await otherEditor.getByLabel('期限日（任意）', { exact: true }).fill('2026-10-21');
    await otherEditor.getByRole('button', { name: '保存', exact: true }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('react-simple-todo.todos')!)[0].dueDate)).toBe('2026-10-21');
    await expect(date).toHaveValue('2026-10-20');
    await save();
    await expect(row('別タブで改名').locator('.due-date')).toHaveText('期限：2026/10/20');
  });

  await test.step('PC・スマートフォンで期限入力がはみ出さない', async () => {
    await page.setViewportSize({ width: 1280, height: 1100 });
    await page.screenshot({ path: 'screenshots/due-date-desktop.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await edit('別タブで改名');
    await expect(date).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'screenshots/due-date-mobile.png', fullPage: true });
    await editor.getByRole('button', { name: 'キャンセル', exact: true }).click();
  });

  await test.step('ローカル午前0時を過ぎると再読み込みせずに期限表示を更新する', async () => {
    await expect(row('今日').locator('.due-today')).toBeVisible();
    await page.clock.fastForward(24 * 60 * 60 * 1000);
    await expect(row('今日').locator('.due-overdue')).toBeVisible();
    await expect(row('明日').locator('.due-today')).toBeVisible();
  });
});
