# API Reference

English | [日本語](../api.md)

## Table of Contents

- [API Reference](#api-reference)
  - [Table of Contents](#table-of-contents)
  - [Core Interfaces](#core-interfaces)
    - [ILogger](#ilogger)
      - [Methods](#methods)
    - [LogEvent](#logevent)
    - [LogFilter](#logfilter)
    - [LoggerOptions](#loggeroptions)
  - [Log Levels](#log-levels)
  - [Filters](#filters)
    - [TimeRangeFilter](#timerangefilter)
    - [LogLevelFilter](#loglevelfilter)
    - [EventTypeFilter](#eventtypefilter)
    - [MetadataFilter](#metadatafilter)
    - [CompositeFilter](#compositefilter)
    - [CustomFilter](#customfilter)
  - [Export](#export)
    - [ExportOptions](#exportoptions)
    - [Exporters](#exporters)
      - [JSON Exporter](#json-exporter)
      - [CSV Exporter](#csv-exporter)
      - [Custom Exporter](#custom-exporter)

## Core Interfaces

### ILogger

Interface defining the main functionality of the logger.

```typescript
interface ILogger {
  log(event: LogEvent): void;
  addFilter(filter: LogFilter): void;
  export(options: ExportOptions): Promise<string>;
  getEvents(filter?: LogFilter): LogEvent[];
  dispose(): void;
}
```

#### Methods

- `log(event: LogEvent)`: Records an event
- `addFilter(filter: LogFilter)`: Adds a filter
- `export(options: ExportOptions)`: Exports events
- `getEvents(filter?: LogFilter)`: Retrieves recorded events
- `dispose()`: Releases logger resources

### LogEvent

Interface defining the structure of a log event.

```typescript
interface LogEvent {
  id: string;              // Unique event ID
  type: string;           // Event type
  timestamp: number;      // Event timestamp (UNIX timestamp)
  level: LogLevel;        // Log level
  details: unknown;       // Event details
  metadata?: Record<string, unknown>; // Additional metadata
}
```

### LogFilter

Interface for log filters.

```typescript
interface LogFilter {
  shouldInclude(event: LogEvent): boolean;
}
```

### LoggerOptions

Logger configuration options.

```typescript
interface LoggerOptions {
  defaultLevel?: LogLevel;      // Default log level
  filters?: LogFilter[];        // Initial filters
  bufferSize?: number;         // Buffer size (maximum number of events to retain)
  autoExport?: {               // Auto-export configuration
    format: "json" | "csv" | "custom";
    interval: number;          // Export interval (milliseconds)
    path: string;             // Export destination path
  };
}
```

## Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,    // Debug information
  VERBOSE = 1,  // Detailed information
  INFO = 2,     // General information
  WARN = 3,     // Warnings
  ERROR = 4,    // Errors
  FATAL = 5     // Fatal errors
}
```

## Filters

### TimeRangeFilter

Filter that includes only events within a specified time range.

```typescript
constructor(startTime: number, endTime: number)
```

### LogLevelFilter

Filter that includes only events at or above a specified log level.

```typescript
constructor(minLevel: LogLevel)
```

### EventTypeFilter

Filter that includes only events of specified types.

```typescript
constructor(types: string[])
```

### MetadataFilter

Filter based on metadata content.

```typescript
constructor(key: string, value: unknown)
```

### CompositeFilter

Filter that combines multiple filters.

```typescript
class CompositeFilter {
  addFilter(filter: LogFilter): void;
  clearFilters(): void;
}
```

### CustomFilter

Filter using a custom predicate function.

```typescript
constructor(predicate: (event: LogEvent) => boolean)
```

## Export

### ExportOptions

Export configuration options.

```typescript
interface ExportOptions {
  format: "json" | "csv" | "custom";
  filter?: LogFilter;
  config?: {
    separator?: string;           // CSV separator
    includeHeaders?: boolean;     // Include/exclude CSV headers
    exportFunction?: (events: LogEvent[]) => string;  // Custom export function
  };
}
```

### Exporters

#### JSON Exporter

Exports events in JSON format.

```typescript
format: "json"
```

#### CSV Exporter

Exports events in CSV format.

```typescript
format: "csv"
config: {
  separator: ",",          // Separator (default: comma)
  includeHeaders: true     // Include header row (default: true)
}
```

#### Custom Exporter

Exports events in a custom format.

```typescript
format: "custom"
config: {
  exportFunction: (events) => string  // Custom transformation function
}