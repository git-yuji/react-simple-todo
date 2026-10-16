import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'Asia/Tokyo', viewport: { width: 390, height: 844 } });

test('日常操作をコンパクトにし、必要な設定だけを開いて使える', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-16T09:00:00+09:00'));
  await page.goto('/');
  const input = page.getByLabel('新しいTodo', { exact: true });
  const dateButton = page.getByRole('button', { name: '期限を追加', exact: true });
  const date = page.locator('#new-due-date');
  const settings = page.getByRole('button', { name: '表示設定', exact: true });
  const panel = page.getByRole('region', { name: '詳細な表示条件', exact: true });
  const search = page.getByRole('searchbox', { name: 'Todoを検索', exact: true });
  const titles = page.locator('.todo-list .todo-label span');

  await test.step('期限を必要なときだけ開き、外した期限を追加に使わない', async () => {
    await expect(date).toBeHidden();
    await expect(settings).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByLabel('並べ替え', { exact: true })).toBeHidden();
    await dateButton.click();
    await expect(date).toBeFocused();
    await date.fill('2026-10-17');
    await date.press('Escape');
    await expect(date).toBeHidden();
    await expect(date).toHaveValue('');
    await expect(dateButton).toBeFocused();
    await input.fill('期限なしで追加');
    await input.press('Enter');
    await expect(input).toBeFocused();
    await expect(page.locator('.todo-list .due-date')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('react-simple-todo.todos')!)[0].dueDate)).toBe(null);
    await input.fill('期限付きで追加');
    await dateButton.click();
    await date.fill('2026-10-16');
    await page.getByRole('button', { name: '追加', exact: true }).click();
    await expect(input).toBeFocused();
    await expect(date).toBeHidden();
    await expect(date).toHaveValue('');
    await expect(page.getByText('期限：2026/10/16・今日まで', { exact: true })).toBeVisible();
  });

  await page.evaluate(() => localStorage.setItem('react-simple-todo.todos', JSON.stringify([
    { id: 'A', title: '読みたい本を探す', completed: false },
    { id: 'B', title: '牛乳とパンを買う', completed: false, dueDate: '2026-10-16' },
    { id: 'C', title: '借りた本を返す', completed: false, dueDate: '2026-10-15' },
    { id: 'D', title: '部屋を掃除する', completed: true, dueDate: '2026-10-16' },
    { id: 'E', title: '来週の予定を立てる', completed: false, dueDate: '2026-10-18' },
  ])));
  await page.reload();

  await test.step('よく使う表示を1回で切り替え、検索と組み合わせる', async () => {
    await page.getByRole('button', { name: '今日まで', exact: true }).click();
    await expect(titles).toHaveText(['牛乳とパンを買う', '借りた本を返す']);
    await page.getByRole('button', { name: '未完了', exact: true }).click();
    await expect(titles).toHaveCount(4);
    await search.fill('牛乳');
    await page.getByRole('button', { name: 'すべて', exact: true }).click();
    await expect(search).toHaveValue('牛乳');
    await expect(titles).toHaveText(['牛乳とパンを買う']);
    await search.fill('見つからないTodo');
    await page.getByRole('button', { name: 'すべてのTodoを表示', exact: true }).click();
    await expect(search).toBeFocused();
    await expect(search).toHaveValue('');
    await expect(titles).toHaveCount(5);
  });

  await test.step('設定を閉じても条件が分かり、Escとリセットで戻れる', async () => {
    await settings.click();
    await expect(settings).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();
    await page.getByLabel('完了状態', { exact: true }).selectOption('active');
    await page.getByLabel('期限で絞り込み', { exact: true }).selectOption('overdue');
    const sort = page.getByLabel('並べ替え', { exact: true });
    await sort.selectOption('due-date');
    await expect(titles).toHaveText(['借りた本を返す']);
    await sort.press('Escape');
    await expect(settings).toBeFocused();
    await expect(settings).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.filter-summary')).toContainText('期限切れ');
    await expect(page.locator('.filter-summary')).toContainText('期限が近い順');
    await expect(page.getByRole('group', { name: 'よく使う表示' }).locator('[aria-pressed="true"]')).toHaveCount(0);
    await page.getByRole('button', { name: '条件をリセット', exact: true }).click();
    await expect(titles).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'すべて', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByLabel('並べ替え', { exact: true })).toHaveValue('added');
    await expect(settings).toHaveAttribute('aria-expanded', 'false');
  });

  await test.step('スマホで一覧が上部に入り、狭い画面でもはみ出さない', async () => {
    expect((await page.getByRole('listitem').first().boundingBox())!.y).toBeLessThan(600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: 'screenshots/usability-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 320, height: 740 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await settings.click();
    await expect(page.getByLabel('並べ替え', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await settings.click();
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.screenshot({ path: 'screenshots/usability-desktop.png', fullPage: true });
  });

  await test.step('保存失敗時の案内を一覧より前に表示する', async () => {
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('保存制限'); }; });
    await input.fill('保存失敗時も入力を残す');
    await input.press('Enter');
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    expect((await alert.boundingBox())!.y).toBeLessThan((await page.getByRole('heading', { name: 'Todo一覧', exact: true }).boundingBox())!.y);
    await expect(page.getByText('Todoはこのブラウザに自動保存されます。', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '保存失敗時も入力を残すを編集', exact: true })).toBeVisible();
  });
});
