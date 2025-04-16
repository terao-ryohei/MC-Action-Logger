import { CoreLogger } from "./core/logger/core-logger";
import { LogLevel } from "./types/core";
import type {
  ILogger,
  LogEvent,
  LogFilter,
  LoggerOptions,
  ExportOptions,
} from "./types/core";
import {
  TimeRangeFilter,
  LogLevelFilter,
  EventTypeFilter,
  MetadataFilter,
  CompositeFilter,
  CustomFilter,
} from "./core/filter/base-filters";
import { createExporter } from "./core/export";
import type { IExporter, ExporterOptions } from "./core/export";

export {
  // Core
  CoreLogger,
  LogLevel,
  // Types
  type ILogger,
  type LogEvent,
  type LogFilter,
  type LoggerOptions,
  type ExportOptions,
  // Filters
  TimeRangeFilter,
  LogLevelFilter,
  EventTypeFilter,
  MetadataFilter,
  CompositeFilter,
  CustomFilter,
  // Export
  createExporter,
  type IExporter,
  type ExporterOptions,
};

// Default logger instance
let defaultLogger: CoreLogger | undefined;

/**
 * Get or create the default logger instance
 * @param options Optional configuration for the logger
 * @returns The default logger instance
 */
export function getDefaultLogger(options?: LoggerOptions): CoreLogger {
  if (!defaultLogger) {
    defaultLogger = new CoreLogger(options);
  }
  return defaultLogger;
}

/**
 * Reset the default logger instance
 * This is useful for testing or when you need to reconfigure the default logger
 */
export function resetDefaultLogger(): void {
  if (defaultLogger) {
    defaultLogger.dispose();
    defaultLogger = undefined;
  }
}
