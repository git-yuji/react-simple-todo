import { expect, test } from '@playwright/test';

test('絞り込みと別タブ更新から編集中の入力とキーボード操作を保護する', async ({ page, context }) => {
  const other = await context.newPage();
  const editor = page.getByRole('form', { name: 'Todoを編集', exact: true });
  const input = editor.getByLabel('タイトルを編集', { exact: true });
  const search = page.getByRole('searchbox', { name: 'Todoを検索', exact: true });

  async function reset() {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('react-simple-todo.todos', JSON.stringify([
      { id: 'A', title: '牛乳', completed: false },
    ])));
    await page.reload();
    await other.goto('/');
    await page.getByRole('button', { name: '牛乳を編集', exact: true }).waitFor();
  }

  async function savedTitle() {
    return page.evaluate(() => JSON.parse(localStorage.getItem('react-simple-todo.todos')!)[0].title);
  }

  await test.step('未完了で絞り込み中に別タブで完了にしても入力と最新の状態を保持する', async () => {
    await reset();
    await page.getByRole('button', { name: '未完了', exact: true }).click();
    await page.getByRole('button', { name: '牛乳を編集', exact: true }).click();
    await input.fill('準備中');
    await other.getByRole('checkbox').check();
    await expect(editor.getByRole('checkbox')).toBeChecked();
    await expect(editor.getByRole('status')).toHaveText('完了');
    await expect(input).toHaveValue('準備中');
    await expect(editor.getByText('条件から外れていますが、', { exact: false })).toBeVisible();
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor).toHaveCount(0);
    await expect(search).toBeFocused();
    await expect.poll(savedTitle).toBe('準備中');
    await expect(other.getByRole('checkbox')).toBeChecked();
    await page.reload();
    await expect(page.getByRole('button', { name: '準備中を編集', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeChecked();
  });

  for (const action of ['保存', 'キャンセル']) {
    await test.step(`検索中に別タブでタイトルを変更しても入力を保持し、${action}後は検索欄へ戻る`, async () => {
      await reset();
      await search.fill('牛乳');
      await page.getByRole('button', { name: '牛乳を編集', exact: true }).click();
      await input.fill('準備中');
      await other.getByRole('button', { name: '牛乳を編集', exact: true }).click();
      await other.getByLabel('タイトルを編集', { exact: true }).fill('パン');
      await other.getByRole('button', { name: '保存', exact: true }).click();
      await expect(editor.getByText('条件から外れていますが、', { exact: false })).toBeVisible();
      await expect(input).toHaveValue('準備中');
      await expect(editor.getByRole('status')).toHaveText('未完了');
      await editor.getByRole('button', { name: action, exact: true }).click();
      await expect(editor).toHaveCount(0);
      await expect(search).toBeFocused();
      await expect(page.getByText('条件に一致するTodoはありません。', { exact: true })).toBeVisible();
      await expect.poll(savedTitle).toBe(action === '保存' ? '準備中' : 'パン');
    });
  }

  await test.step('検索から外れるタイトルをEnterで保存した後もTabで操作できる', async () => {
    await reset();
    await search.fill('牛乳');
    await page.getByRole('button', { name: '牛乳を編集', exact: true }).click();
    await input.fill('パン');
    await input.press('Enter');
    await expect(editor).toHaveCount(0);
    await expect(search).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: '表示設定', exact: true })).toBeFocused();
    await expect.poll(savedTitle).toBe('パン');
  });

  for (const target of ['入力', '保存', 'キャンセル']) {
    await test.step(`${target}にフォーカスがあってもEscで取り消せる`, async () => {
      await reset();
      const editButton = page.getByRole('button', { name: '牛乳を編集', exact: true });
      await editButton.click();
      await input.fill('変更しない');
      if (target !== '入力') await editor.getByRole('button', { name: target, exact: true }).focus();
      await page.keyboard.press('Escape');
      await expect(editor).toHaveCount(0);
      await expect(editButton).toBeFocused();
      await expect.poll(savedTitle).toBe('牛乳');
    });
  }

  await test.step('IME変換中のEscとEnterでは編集を終了しない', async () => {
    await reset();
    await page.getByRole('button', { name: '牛乳を編集', exact: true }).click();
    await input.fill('日本語を変換中');
    for (const key of ['Escape', 'Enter']) {
      await input.dispatchEvent('keydown', { key, isComposing: true, bubbles: true, cancelable: true });
      await expect(input).toHaveValue('日本語を変換中');
      await input.dispatchEvent('keydown', { key, keyCode: 229, bubbles: true, cancelable: true });
      await expect(input).toHaveValue('日本語を変換中');
    }
    await expect.poll(savedTitle).toBe('牛乳');
    await editor.getByRole('checkbox').check();
    await expect(editor.getByRole('status')).toHaveText('完了');
    await expect(input).toHaveValue('日本語を変換中');
    await input.press('Escape');
  });
});
