# DB仕様

```mermaid
erDiagram
    events ||--o{ articles : "event_id"
    events ||--o{ event_members : "event_id"
    users ||--o{ event_members : "user_id"

    events {
        uuid id PK
        text slug UK
        text name
        timestamptz created_at
        timestamptz updated_at
    }

    articles {
        uuid id PK
        uuid event_id FK
        text title
        jsonb content
        timestamptz created_at
        timestamptz updated_at
    }

    users {
        uuid id PK "auth.users.id"
        timestamptz created_at
        timestamptz updated_at
        timestamptz deleted_at
    }

    event_members {
        uuid user_id PK,FK
        uuid event_id PK,FK
        event_member_role role
        timestamptz created_at
        timestamptz updated_at
    }
```

## events

文化祭1つ = 1行。テナントの単位。

| 列           | 型            | NULL | 既定値              | 説明                              |
| ------------ | ------------- | ---- | ------------------- | --------------------------------- |
| `id`         | `uuid`        | NO   | `gen_random_uuid()` | 主キー                            |
| `slug`       | `text`        | NO   |                     | イベントの識別子。全体で一意      |
| `name`       | `text`        | NO   |                     | 文化祭の名前                      |
| `created_at` | `timestamptz` | NO   | `now()`             |                                   |
| `updated_at` | `timestamptz` | NO   | `now()`             | 更新時にトリガーで `now()` にする |

### 制約・インデックス

- `unique (slug)`

### RLS

| 操作                           | 許可する条件                |
| ------------------------------ | --------------------------- |
| `select`                       | そのイベントのメンバー      |
| `insert` / `update` / `delete` | なし（`service_role` のみ） |

## articles

記事のタイトルと本文。1行 = 1記事。

| 列           | 型            | NULL | 既定値              | 説明                                                                                                |
| ------------ | ------------- | ---- | ------------------- | --------------------------------------------------------------------------------------------------- |
| `id`         | `uuid`        | NO   | `gen_random_uuid()` | 主キー                                                                                              |
| `event_id`   | `uuid`        | NO   |                     | `events.id`。イベントを消すと一緒に消える                                                           |
| `title`      | `text`        | NO   | `''`                | 記事のタイトル。100文字まで。空文字可                                                               |
| `content`    | `jsonb`       | NO   | `'[]'`              | BlockNoteのブロック配列。形は `articleDocumentSchema`（`packages/schema/src/article.ts`）で検証する |
| `created_at` | `timestamptz` | NO   | `now()`             |                                                                                                     |
| `updated_at` | `timestamptz` | NO   | `now()`             | 更新時にトリガーで `now()` にする                                                                   |

### 制約・インデックス

- `foreign key (event_id) references events (id) on delete cascade`
- `check (char_length(title) <= 100)`
- `index (event_id, updated_at desc)` … 一覧（イベント内で更新日時の新しい順）用

### RLS

| 操作                | 許可する条件                                                    |
| ------------------- | --------------------------------------------------------------- |
| `select`            | `event_id` のイベントのメンバー                                 |
| `insert` / `update` | `event_id` のイベントの `staff`（更新後の `event_id` でも判定） |
| `delete`            | なし（`service_role` のみ）                                     |

## users

ログインできる人1人 = 1行。Supabase Auth の `auth.users` と 1:1 で、ウェブアプリ・管理者サイトで共通。

| 列           | 型            | NULL | 既定値  | 説明                                                         |
| ------------ | ------------- | ---- | ------- | ------------------------------------------------------------ |
| `id`         | `uuid`        | NO   |         | 主キー。`auth.users.id`。Auth のユーザーを消すと一緒に消える |
| `created_at` | `timestamptz` | NO   | `now()` |                                                              |
| `updated_at` | `timestamptz` | NO   | `now()` | 更新時にトリガーで `now()` にする                            |
| `deleted_at` | `timestamptz` | YES  |         | 論理削除した日時。削除していなければ `NULL`                  |

### 行の作成

- `auth.users` に行が入ったとき（メールアドレスでの新規登録・Google での初回ログイン）に、トリガーで1行作る

### 制約・インデックス

- `foreign key (id) references auth.users (id) on delete cascade`

### RLS

| 操作                           | 許可する条件                           |
| ------------------------------ | -------------------------------------- |
| `select`                       | `id` = `auth.uid()`                    |
| `insert` / `update` / `delete` | なし（トリガーと `service_role` のみ） |

## event_members

ユーザーがどのイベントに、どの役割で所属しているか。1行 = 1人の1イベントへの所属。
年度をまたいで複数のイベントに所属でき、イベントごとに役割が違ってよい。

| 列           | 型                  | NULL | 既定値  | 説明                                      |
| ------------ | ------------------- | ---- | ------- | ----------------------------------------- |
| `user_id`    | `uuid`              | NO   |         | `users.id`。ユーザーを消すと一緒に消える  |
| `event_id`   | `uuid`              | NO   |         | `events.id`。イベントを消すと一緒に消える |
| `role`       | `event_member_role` | NO   |         | `staff`（運営）/ `visitor`（来場者）      |
| `created_at` | `timestamptz`       | NO   | `now()` |                                           |
| `updated_at` | `timestamptz`       | NO   | `now()` | 更新時にトリガーで `now()` にする         |

脱退は行を消す（論理削除しない）。

### 制約・インデックス

- `primary key (user_id, event_id)`
- `foreign key (user_id) references users (id) on delete cascade`
- `foreign key (event_id) references events (id) on delete cascade`
- `index (event_id)` … イベントのメンバーを引く用

### 所属の判定

RLS から次の関数を呼んで判定する。`private` スキーマに置き、API（PostgREST）からは呼べない。
`security definer` で、`event_members` 自身の RLS を通さずに引く。

| 関数                                | `true` を返す条件                                                          |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `private.is_event_member(event_id)` | `auth.uid()` の `event_members` の行があり、`users` が論理削除されていない |
| `private.is_event_staff(event_id)`  | 上に加えて、`role` が `staff`                                              |

### RLS

| 操作                           | 許可する条件                |
| ------------------------------ | --------------------------- |
| `select`                       | `user_id` = `auth.uid()`    |
| `insert` / `update` / `delete` | なし（`service_role` のみ） |
