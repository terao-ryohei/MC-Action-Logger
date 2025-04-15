/**
 * ロギングのためのユーティリティ関数群
 */
export const LoggerUtils = {
  /**
   * 時間のフォーマット
   * @param ms ミリ秒
   * @returns フォーマットされた時間文字列
   */
  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}時間${minutes % 60}分${seconds % 60}秒`;
    }
    if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  },

  /**
   * テンプレート文字列の変数を置換
   * @param template テンプレート文字列
   * @param variables 変数マップ
   * @returns 変数が置換された文字列
   */
  replaceTemplateVariables(
    template: string,
    variables: Record<string, unknown>,
  ): string {
    return template.replace(/\${(\w+)}/g, (_, key: string) => {
      const value = variables[key];
      return value !== undefined ? String(value) : "";
    });
  },

  /**
   * 値を文字列に変換
   * @param value 変換する値
   * @returns 文字列表現
   */
  valueToString(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "object") {
      if (isPosition(value)) {
        // Vector3のような位置情報オブジェクト
        return `(${value.x}, ${value.y}, ${value.z})`;
      }
      try {
        return JSON.stringify(value);
      } catch {
        return Object.prototype.toString.call(value);
      }
    }

    return String(value);
  },

  /**
   * タイムスタンプを日付文字列に変換
   * @param timestamp タイムスタンプ（ミリ秒）
   * @returns 日付文字列
   */
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  },
};

/**
 * 位置情報オブジェクトの型定義
 */
interface Position {
  x: number;
  y: number;
  z: number;
}

/**
 * 値が位置情報オブジェクトかどうかをチェック
 */
function isPosition(value: unknown): value is Position {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    "y" in value &&
    "z" in value &&
    typeof (value as Position).x === "number" &&
    typeof (value as Position).y === "number" &&
    typeof (value as Position).z === "number"
  );
}
