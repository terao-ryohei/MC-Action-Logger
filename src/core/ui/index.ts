import type { IUIConfig } from "../../types/config";

/**
 * UIイベントの型定義
 */
type UIEventType =
  | "logToggle"
  | "filterApply"
  | "logClear"
  | "themeChange"
  | "fontSizeChange";

/**
 * UIイベントハンドラーの型定義
 */
type UIEventHandler = (event: CustomEvent) => void;

/**
 * UIの状態を表すインターフェース
 */
interface UIState {
  isLogVisible: boolean;
  currentFilter: string | null;
  scrollPosition: number;
  selectedTheme: string;
}

/**
 * UIマネージャークラス
 */
export class UIManager {
  private config: IUIConfig;
  private state: UIState;
  private eventHandlers: Map<UIEventType, Set<UIEventHandler>>;
  private rootElement: HTMLElement | null;

  constructor(config: IUIConfig) {
    this.config = config;
    this.state = {
      isLogVisible: true,
      currentFilter: null,
      scrollPosition: 0,
      selectedTheme: config.theme.backgroundColor,
    };
    this.eventHandlers = new Map();
    this.rootElement = null;
  }

  /**
   * UIの初期化
   */
  public initialize(rootElement: HTMLElement): void {
    this.rootElement = rootElement;
    this.applyTheme();
    this.setupEventListeners();
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    if (!this.rootElement) return;

    // ログトグルボタンのイベントリスナー
    const toggleButton = this.rootElement.querySelector(".log-toggle");
    toggleButton?.addEventListener("click", () => {
      this.toggleLogVisibility();
    });

    // スクロールイベントの処理
    const logContainer = this.rootElement.querySelector(".log-container");
    logContainer?.addEventListener("scroll", (e) => {
      const target = e.target as HTMLElement;
      this.state.scrollPosition = target.scrollTop;
    });
  }

  /**
   * イベントハンドラーの登録
   */
  public on(eventType: UIEventType, handler: UIEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)?.add(handler);
  }

  /**
   * イベントハンドラーの削除
   */
  public off(eventType: UIEventType, handler: UIEventHandler): void {
    this.eventHandlers.get(eventType)?.delete(handler);
  }

  /**
   * イベントの発火
   */
  private emit(eventType: UIEventType, detail?: Record<string, unknown>): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const event = new CustomEvent(eventType, { detail });
      for (const handler of handlers) {
        handler(event);
      }
    }
  }

  /**
   * ログの表示/非表示を切り替え
   */
  public toggleLogVisibility(): void {
    this.state.isLogVisible = !this.state.isLogVisible;
    this.emit("logToggle", { isVisible: this.state.isLogVisible });
    this.updateLogVisibility();
  }

  /**
   * ログの表示状態を更新
   */
  private updateLogVisibility(): void {
    if (!this.rootElement) return;

    const logContainer = this.rootElement.querySelector(".log-container");
    if (logContainer instanceof HTMLElement) {
      logContainer.style.display = this.state.isLogVisible ? "block" : "none";
    }
  }

  /**
   * フィルターの適用
   */
  public applyFilter(filterText: string): void {
    this.state.currentFilter = filterText;
    this.emit("filterApply", { filter: filterText });
  }

  /**
   * ログのクリア
   */
  public clearLog(): void {
    this.emit("logClear");
  }

  /**
   * テーマの適用
   */
  private applyTheme(): void {
    if (!this.rootElement) return;

    const { backgroundColor, textColor, accentColor } = this.config.theme;
    this.rootElement.style.setProperty("--background-color", backgroundColor);
    this.rootElement.style.setProperty("--text-color", textColor);
    this.rootElement.style.setProperty("--accent-color", accentColor);
    this.rootElement.style.setProperty(
      "--font-size",
      `${this.config.fontSize}px`,
    );
  }

  /**
   * テーマの更新
   */
  public updateTheme(newTheme: Partial<IUIConfig["theme"]>): void {
    this.config.theme = { ...this.config.theme, ...newTheme };
    this.applyTheme();
    this.emit("themeChange", { theme: this.config.theme });
  }

  /**
   * フォントサイズの更新
   */
  public updateFontSize(size: number): void {
    this.config.fontSize = size;
    this.applyTheme();
    this.emit("fontSizeChange", { fontSize: size });
  }

  /**
   * 設定の更新
   */
  public updateConfig(newConfig: Partial<IUIConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyTheme();
  }

  /**
   * UIの状態を取得
   */
  public getState(): Readonly<UIState> {
    return { ...this.state };
  }

  /**
   * UIの設定を取得
   */
  public getConfig(): Readonly<IUIConfig> {
    return { ...this.config };
  }

  /**
   * クリーンアップ処理
   */
  public dispose(): void {
    this.eventHandlers.clear();
    this.rootElement = null;
  }
}
