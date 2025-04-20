# Minecraft スクリプトアクションロガー ユーザーガイド

## 1. はじめに

このアドオンは、Minecraftでのプレイヤーの行動を自動的に記録し、ゲーム内での活動を分かりやすく確認できるようにするツールです。

主な機能：
- ブロックの使用履歴の記録
- アイテムの作成・使用の追跡
- ゲーム内イベントのログ保存
- 活動の統計情報の表示
- ゲーム時間の管理と表示

## 2. ゲームの開始と終了方法

### 開始方法
1. Minecraftを起動する
2. このアドオンを適用したワールドを開始する
3. 時計アイテムを持って右クリックしてゲームを開始する
   - 自動的にタイマーが開始されます
   - 画面右上に残り時間が表示されます
   - 残り時間が10秒を切ると警告音が鳴ります

### 終了方法
- タイマーが0になると自動的に終了します

## 3. アイテムの使い方

### 時計アイテム
- 右クリック：ゲームの開始

### 紙アイテム（ログブック）
- 右クリック：ログの表示

### ブロックの操作
以下のブロックの使用が自動的に記録されます：

- 作業台：アイテムのクラフト
- チェスト・樽：アイテムの収納/取り出し
- かまど・高炉：アイテムの精錬
- エンチャント台：エンチャントの付与
- 金床：アイテムの修繕/名前変更
- 醸造台：ポーションの作成
- 石切台：ブロックの加工
- コンポスター：アイテムの堆肥化

各ブロックの操作は自動的に記録され、以下の情報が保存されます：
- 使用したアイテムの数と種類
- 作業の進捗状況
- 作業にかかった時間
- 作業の結果（成功/失敗）

## 4. ログの見方

### コマンドでのログ確認
ゲーム内で以下のコマンドを使用できます（`/scriptevent` コマンドを使用）：

基本コマンド：
- `/scriptevent scriptlog:show [件数]` - 最新のログを表示（デフォルト10件）
- `/scriptevent scriptlog:history` - 全てのログを表示
- `/scriptevent scriptlog:stats` - 統計情報を表示

検索・フィルター：
- `/scriptevent scriptlog:search <キーワード>` - キーワード検索
- `/scriptevent scriptlog:filter <カテゴリ>` - カテゴリでフィルター
- `/scriptevent scriptlog:time <開始Unix秒> <終了Unix秒>` - 時間範囲で表示
- `/scriptevent scriptlog:player <名前>` - プレイヤーで絞り込み

管理コマンド：
- `/scriptevent scriptlog:pause` - ログ記録を一時停止
- `/scriptevent scriptlog:resume` - ログ記録を再開
- `/scriptevent scriptlog:clear` - ログをクリア

## 5. イベントの種類と意味

記録される主なイベント：

1. クラフト関連
   - アイテムの作成開始/完了

2. 収納関連
   - アイテムの収納
   - アイテムの取り出し

3. 加工関連
   - 精錬の開始/完了
   - エンチャントの付与
   - アイテムの修繕

4. エンティティのライフサイクル
   - エンティティの死亡（種類、位置、死因、加害者情報）
   ※プレイヤーは含まれません

5. プレイヤーの状態変化
   - 体力の変化（現在値/最大値）
   - 空腹度の変化（満腹度/満腹度上限）
   - 経験値の変化（レベル、進捗）
   - ステータス効果の追加（効果の種類、強さ、持続時間）
   - ステータス効果の消失

6. その他
   - ブロックの設置/破壊
   - アイテムの使用

## 6. よくある質問

Q: ログは自動的に保存されますか？
A: はい、全ての活動はゲーム時間内であれば自動的に保存されます。

Q: 過去のログを見ることはできますか？
Q: エンティティの状態変化はリアルタイムで記録されますか？
A: はい、エンティティのスポーンと死亡は発生時に即座に記録されます。ただし、プレイヤーのスポーン/死亡は記録対象外です。

Q: プレイヤーの状態変化はどのくらいの頻度で記録されますか？
A: 体力、空腹度、経験値は1秒ごとにチェックされ、変化があった場合のみ記録されます。ステータス効果の追加は即座に記録され、効果の消失は1秒以内に検知されます。

Q: 古いエンティティのログも保存されますか？
A: はい、他のログと同様に最新1000件まで保存されます。`/scriptevent scriptlog:filter entity` コマンドでエンティティ関連のログのみを表示できます。

A: はい、紙アイテムを使用するか `/scriptevent scriptlog:history` コマンドで確認できます。

Q: ログの容量制限はありますか？
A: 最新1000件の操作が保存されます。古いログは自動的に削除されます。

Q: プレイヤーごとの活動を分けて見ることはできますか？
A: はい、`/scriptevent scriptlog:player <プレイヤー名>` で特定のプレイヤーの活動のみを表示できます。

Q: ログ機能を一時的に無効にできますか？
A: はい、`/scriptevent scriptlog:pause` で一時停止、`/scriptevent scriptlog:resume` で再開できます。

Q: タイマーを途中で延長できますか？
A: タイマー関連のコマンドは現在実装されていません。

Q: ログの検索で使えるカテゴリは何がありますか？
A: 以下のカテゴリが利用できます：
- craft（クラフト関連）
- storage（収納関連）
- smelt（精錬関連）
- enchant（エンチャント関連）
- repair（修繕関連）
- brew（醸造関連）
- block（ブロック操作）
- move（移動関連）
- entity（エンティティのスポーン/死亡）
- player_state（プレイヤーの状態変化）

## 7. トラブルシューティング

### ログが表示されない場合
1. 紙アイテムを一度インベントリから外し、再度取得する
2. `/scriptevent scriptlog:resume` コマンドでログ記録を再開（一時停止していた場合）
3. ワールドを一度セーブして再ログイン

### タイマーが動作しない場合
1. 時計アイテムを一度インベントリから外し、再度取得する
2. 管理者に確認を依頼

### コマンドが機能しない場合
1. 実験的なゲームプレイが有効になっているか確認
2. アドオンが正しく適用されているか確認

## 8. API リファレンス

### ActionLoggerModule

#### メソッド

```typescript
// シングルトンインスタンスの取得
static getInstance(): ActionLoggerModule

// モジュールの初期化
initialize(config?: Partial<LoggerConfiguration>): void

// 設定の更新
updateConfig(config: Partial<LoggerConfiguration>): void

// エクスポーター設定の初期化
initializeExporter(config: ExportConfiguration): void

// ログのエクスポート
exportLogs(): Promise<void>

// 全ログの取得
getLogs(): PlayerLog[]

// 現在の設定を取得
getConfig(): LoggerConfiguration

// ゲームの開始
startGame(): void

// ゲームの停止
stopGame(): void

// リソースの解放
dispose(): void
```

### 設定ファイルのスキーマ

#### LoggerConfiguration

```typescript
interface LoggerConfiguration {
  gameTime: {
    maxDuration: number;      // 最大ゲーム時間（秒）
    warningTime?: number;     // 警告を表示する残り時間（秒）
  };
  filters: {
    minLogLevel: "debug" | "info" | "warn" | "error";
    customFilters?: string[];  // 有効にするフィルター
  };
}
```

#### ExportConfiguration

```typescript
interface ExportConfiguration {
  format: "json" | "csv";     // 出力形式
  outputPath: string;         // 出力先ディレクトリ
  compression?: boolean;      // 圧縮の有効/無効
  filename?: string;          // 出力ファイル名
}
```

#### PlayerLog

```typescript
interface PlayerLog {
  id: string;                 // ログID
  timestamp: number;          // タイムスタンプ
  player: string;            // プレイヤー名
  type: string;              // アクション種別
  details: Record<string, any>; // 詳細情報
  position?: Vector3;        // 位置情報
}
```

## 9. エラーハンドリング

### よくあるエラーと対処方法

1. 初期化エラー
```typescript
try {
  logger.initialize(config);
} catch (error) {
  console.error("初期化エラー:", error);
  // 再初期化を試みるか、デフォルト設定で初期化
}
```

2. エクスポートエラー
```typescript
try {
  await logger.exportLogs();
} catch (error) {
  console.error("エクスポートエラー:", error);
  // 一時ファイルにバックアップを試みる
}
```

3. 設定更新エラー
```typescript
try {
  logger.updateConfig(newConfig);
} catch (error) {
  console.error("設定更新エラー:", error);
  // 以前の設定を維持
}
```

## 10. ビルド手順

### 環境変数の設定

1. プロジェクトのルートディレクトリに `.env` ファイルを作成します。

2. 以下の環境変数を設定します：

```
WIN_OUTPUT_DIR=C:/Path/To/Your/Minecraft/development_behavior_packs
WIN_OUTPUT_DIR2=C:/Path/To/Your/Minecraft/development_resource_packs
```

必要な環境変数の説明：
- `WIN_OUTPUT_DIR`: ビヘイビアパックの出力先ディレクトリ
- `WIN_OUTPUT_DIR2`: リソースパックの出力先ディレクトリ

設定例：
```
WIN_OUTPUT_DIR=C:/Users/YourName/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_behavior_packs
WIN_OUTPUT_DIR2=C:/Users/YourName/AppData/Local/Packages/Microsoft.MinecraftUWP_8wekyb3d8bbwe/LocalState/games/com.mojang/development_resource_packs
```

### 環境変数設定のトラブルシューティング

1. .envファイルが認識されない場合：
   - ファイル名が正確に `.env` であることを確認（.env.txtではない）
   - ファイルがプロジェクトのルートディレクトリにあることを確認
   - ファイルを一度開いて保存し直す

2. パスが正しく認識されない場合：
   - パスの区切り文字が正しいことを確認（Windowsでも / を使用）
   - パスの最後にスラッシュを付けない
   - パスに日本語や特殊文字が含まれていないことを確認

3. ビルドエラーが発生する場合：
   - 指定したディレクトリが実際に存在することを確認
   - 指定したディレクトリへの書き込み権限があることを確認
   - Minecraftが実行中の場合は一度終了してから再試行
