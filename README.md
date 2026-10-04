# はじめてのReact Todoアプリ

ReactとViteを使った、初心者向けの小さなTodoアプリです。TypeScriptで実装しています。

## 起動方法

Node.js 22.12以上の22系、または24系以降を使ってください。

```sh
cd react-simple-todo
npm install
npm run dev
```

ターミナルに表示されるURLをブラウザで開きます。

## できること

- Todoを追加（Enterキーでも追加できます）
- チェックボックスで完了・未完了を切り替え
- Todoを削除
- 全件数と未完了の件数を表示
- タイトルの部分一致で検索（英字の大文字・小文字は区別せず、検索語の前後の空白は無視）
- 「すべて」「未完了」「完了」で絞り込み（検索と組み合わせて使えます）
- 表示件数の確認と「条件をリセット」で全件表示に戻す

空白だけのTodoは追加できません。データはメモリ上に保持しているため、ページを再読み込みすると消えます。

## コードを読む順番

1. `src/main.tsx`：Reactの画面をHTMLに表示する入口です。
2. `src/App.tsx`：Todo一覧の状態と追加・完了切り替え・削除を管理します。
3. `src/components/TodoForm.tsx`：入力文字の状態と追加フォームを管理します。
4. `src/components/TodoItem.tsx`：1件のTodoを表示します。
5. `src/types/todo.ts`：複数のコンポーネントで共有するTodoの型です。
6. `src/style.css`：見た目とスマートフォン向けの調整です。
7. `src/components/TodoFilters.tsx`：検索入力と完了状態の切り替えです。
8. `src/utils/filterTodos.ts`：検索と完了状態の両方に一致するTodoを取り出します。

## 学習ポイント

- **useState**：入力文字とTodo一覧を保存します。更新関数を呼ぶと画面も更新されます。
- **onChange / onSubmit / onClick**：入力・送信・クリックに応じて関数を実行します。
- **map**：Todo一覧を表示したり、指定したTodoの完了状態を変えたりします。
- **filter**：指定したTodoを除外したり、未完了の件数を求めたりします。
- **スプレッド構文**：元の配列やオブジェクトを直接書き換えず、新しいものを作ります。
- **key**：Reactが各Todoを識別できるよう、一意のIDを渡します。
- **type Todo**：IDとタイトルは`string`、完了状態は`boolean`として定義します。
- **useState<Todo[]>**：Todoの配列を状態として保持することを指定します。
- **FormEvent<HTMLFormElement>**：フォーム送信イベントの型を指定します。
- **props**：親の`App`から子のコンポーネントへ、データや関数を渡します。

### propsの流れ

`App`は`TodoForm`に`onAdd={addTodo}`を渡します。フォームを送信すると、`TodoForm`が`onAdd(title)`を呼び、`App`がTodo一覧を更新します。入力文字は`TodoForm`内で管理します。

`TodoItem`には`todo`と`onToggle`・`onDelete`を渡します。チェックや削除の操作では、受け取った関数にTodoのIDを渡します。Todo一覧を更新する処理は`App`にまとまっています。

`TodoFormProps`と`TodoItemProps`で、受け取るデータや関数の型を定義しています。

JSXを含むTypeScriptファイルの拡張子は`.tsx`です。`tsconfig.json`で型チェックの設定を管理します。

検索語と完了状態は`App`の状態として管理します。`filterTodos`は元のTodo一覧を変更せず、表示用の一覧を作ります。そのため、絞り込み中も全件数と残り件数は全体の値を表示します。

## 動作確認

1. 文字を入力して「追加」を押すと1件表示され、入力欄が空になる。
2. Enterキーでも追加でき、空白だけの入力では追加できない。
3. チェックすると取り消し線が付き、残り件数が減る。再度チェックすると戻る。
4. 「削除」で対象のTodoだけが消える。最後の1件を消すと空の案内が表示される。
5. 「Reactの勉強」と「買い物」を追加し、検索欄に「react」を入力すると前者だけが表示される。「 REACT 」でも同じ結果になる。
6. 検索中に「完了」を選ぶと完了済みの一致するTodoだけが表示される。該当しない場合は「条件に一致するTodoはありません。」が表示される。
7. 「未完了」表示中にTodoを完了にすると一覧から消え、残り件数と表示件数が更新される。「完了」で再び表示される。
8. 「条件をリセット」を押すと検索欄が空になり、「すべて」に戻る。検索や絞り込みではTodo自体は削除されない。

```sh
npm run typecheck
npm run build
npm run preview
```

`typecheck`は型の誤りを確認します。`build`は型チェック後に公開用ファイルを`dist`に作成し、`preview`はその結果をローカルで確認します。

公式資料：[React](https://react.dev/learn) / [Vite](https://vite.dev/guide/) / [TypeScriptの設定](https://www.typescriptlang.org/tsconfig/)
