# ActionLogger

English | [日本語](../../README.md)

ActionLogger is a flexible and extensible logging library that supports event-based logging, powerful filtering capabilities, and various export formats.

## Features

- 💡 6 Log Levels (DEBUG, VERBOSE, INFO, WARN, ERROR, FATAL)
- 🔍 Flexible Filtering System (with Scoreboard Integration)
- 📤 JSON/CSV Export Support
- 🔄 Auto-Export Functionality
- 🎯 Metadata Support
- 🛠️ Customizable Filters and Exporters

## Installation

Using npm:

```bash
npm install @minecraft/action-logger
```

Using Yarn:

```bash
yarn add @minecraft/action-logger
```

## Basic Usage

```typescript
import { CoreLogger, LogLevel } from '@minecraft/action-logger';

// Create a logger instance
const logger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  bufferSize: 1000,
  autoExport: {
    format: "json",
    interval: 60000, // Auto-export every minute
    path: "./logs"
  }
});

// Log an event
logger.log({
  type: "user_action",
  level: LogLevel.INFO,
  details: {
    action: "login",
    userId: "12345"
  },
  metadata: {
    browser: "Chrome",
    version: "89.0.4389.82"
  }
});

// Get filtered events
const events = logger.getEvents();

// Export events
const jsonData = await logger.export({ format: "json" });

// Release resources when done
logger.dispose();
```

## Advanced Usage

Using filters:

```typescript
import { TimeRangeFilter, LogLevelFilter, EventTypeFilter } from '@minecraft/action-logger';

// Time range filter
const timeFilter = new TimeRangeFilter(
  Date.now() - 3600000, // 1 hour ago
  Date.now()
);

// Log level filter
const levelFilter = new LogLevelFilter(LogLevel.WARN);

// Event type filter
const typeFilter = new EventTypeFilter(['user_action', 'system_event']);

// Add filters
logger.addFilter(timeFilter);
logger.addFilter(levelFilter);
logger.addFilter(typeFilter);
```

Scoreboard filters:

```typescript
import { ScoreboardFilterManager, ScoreboardEventTypeFilter } from '@minecraft/action-logger';

// Initialize scoreboard filter manager
const filterManager = new ScoreboardFilterManager();
await filterManager.initializeScoreboards();

// Create an event type filter with scoreboard control
const blockFilter = new ScoreboardEventTypeFilter(
  "block",  // Identifier in scoreboard
  ["block_broken", "block_placed"]
);

// Register the filter
logger.addFilter(blockFilter);

// Control filters in-game using scoreboard commands:
// /scoreboard players set block log_filters 1  # Enable
// /scoreboard players set block log_filters 0  # Disable
```

Custom export:

```typescript
const customExport = await logger.export({
  format: "custom",
  config: {
    exportFunction: (events) => {
      // Convert events to custom format
      return events.map(e => `${e.timestamp}: ${e.type} - ${e.details}`).join('\n');
    }
  }
});
```

## API Documentation

For detailed API documentation, please see [here](../api.md).

## Examples and Sample Code

For more detailed examples and sample code, please see [here](../examples.md).

## License

Released under the MIT License. See [LICENSE](../../LICENSE) file for details.