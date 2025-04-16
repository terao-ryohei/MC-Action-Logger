# Examples and Sample Code

English | [日本語](../examples.md)

## Table of Contents

- [Basic Usage](#basic-usage)
- [Working with Filters](#working-with-filters)
- [Export Features](#export-features)
- [Practical Scenarios](#practical-scenarios)

## Basic Usage

### Simple Logging

```typescript
import { CoreLogger, LogLevel } from '@minecraft/action-logger';

// Basic logger setup
const logger = new CoreLogger();

// Log info level event
logger.log({
  type: "app_status",
  level: LogLevel.INFO,
  details: "Application has started"
});

// Log warning level event
logger.log({
  type: "system_warning",
  level: LogLevel.WARN,
  details: "Memory usage exceeds 80%",
  metadata: {
    memoryUsage: 82,
    timestamp: Date.now()
  }
});
```

### Auto-Export Configuration

```typescript
const logger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  bufferSize: 5000,
  autoExport: {
    format: "json",
    interval: 300000, // Every 5 minutes
    path: "./logs/auto-export"
  }
});
```

## Working with Filters

### Combining Multiple Filters

```typescript
import {
  CoreLogger,
  LogLevel,
  TimeRangeFilter,
  LogLevelFilter,
  EventTypeFilter
} from '@minecraft/action-logger';

const logger = new CoreLogger();

// Filter to show only error logs from the past hour
const hourAgo = Date.now() - 3600000;
logger.addFilter(new TimeRangeFilter(hourAgo, Date.now()));
logger.addFilter(new LogLevelFilter(LogLevel.ERROR));

// Filter specific event types
logger.addFilter(new EventTypeFilter(['user_error', 'system_error']));

// Get filtered events
const errorEvents = logger.getEvents();
```

### Creating Custom Filters

```typescript
import { CustomFilter } from '@minecraft/action-logger';

// Filter based on user ID
const userFilter = new CustomFilter((event) => {
  if (event.metadata?.userId) {
    return event.metadata.userId === "12345";
  }
  return false;
});

logger.addFilter(userFilter);
```

## Export Features

### JSON Export

```typescript
// Export all events as JSON
const jsonData = await logger.export({ format: "json" });

// Save to file
import { writeFileSync } from 'fs';
writeFileSync('./logs/export.json', jsonData);
```

### CSV Export

```typescript
// CSV export with custom separator
const csvData = await logger.export({
  format: "csv",
  config: {
    separator: ";",
    includeHeaders: true
  }
});
```

### Custom Format Export

```typescript
// Convert to Markdown format
const markdownExport = await logger.export({
  format: "custom",
  config: {
    exportFunction: (events) => {
      return events.map(e => {
        const level = `[${LogLevel[e.level]}]`.padEnd(8);
        return `- ${level} ${new Date(e.timestamp).toISOString()} - ${e.type}\n  ${JSON.stringify(e.details)}`;
      }).join('\n');
    }
  }
});
```

## Practical Scenarios

### User Activity Tracking

```typescript
import { CoreLogger, LogLevel, MetadataFilter } from '@minecraft/action-logger';

// Setup activity logger
const activityLogger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  autoExport: {
    format: "json",
    interval: 3600000, // Every hour
    path: "./logs/user-activity"
  }
});

// Log user actions
function logUserAction(userId: string, action: string, details: any) {
  activityLogger.log({
    type: "user_action",
    level: LogLevel.INFO,
    details: {
      action,
      ...details
    },
    metadata: {
      userId,
      timestamp: new Date().toISOString()
    }
  });
}

// Get activity for specific user
const userFilter = new MetadataFilter("userId", "12345");
const userActivity = activityLogger.getEvents(userFilter);
```

### Error Monitoring System

```typescript
import { CoreLogger, LogLevel, CustomFilter } from '@minecraft/action-logger';

// Setup error logger
const errorLogger = new CoreLogger({
  defaultLevel: LogLevel.ERROR,
  autoExport: {
    format: "json",
    interval: 60000, // Every minute
    path: "./logs/errors"
  }
});

// Configure error handler
window.onerror = (message, source, lineno, colno, error) => {
  errorLogger.log({
    type: "unhandled_error",
    level: LogLevel.ERROR,
    details: {
      message,
      source,
      lineno,
      colno,
      stack: error?.stack
    },
    metadata: {
      browser: navigator.userAgent,
      timestamp: Date.now()
    }
  });
};

// Monitor critical errors
const criticalErrorFilter = new CustomFilter((event) => {
  return event.level === LogLevel.ERROR &&
         event.details?.stack?.includes("api.critical");
});

// Monitoring process
setInterval(() => {
  const criticalErrors = errorLogger.getEvents(criticalErrorFilter);
  if (criticalErrors.length > 0) {
    notifyTeam(criticalErrors); // Send notifications
  }
}, 300000); // Check every 5 minutes
```

### Performance Monitoring

```typescript
import { CoreLogger, LogLevel, TimeRangeFilter } from '@minecraft/action-logger';

// Setup performance monitoring logger
const performanceLogger = new CoreLogger({
  defaultLevel: LogLevel.INFO,
  bufferSize: 10000
});

// Record performance metrics
function logPerformanceMetric(metric: string, value: number) {
  performanceLogger.log({
    type: "performance_metric",
    level: LogLevel.INFO,
    details: {
      metric,
      value
    },
    metadata: {
      timestamp: Date.now()
    }
  });
}

// Analyze performance
function analyzePerformance(startTime: number, endTime: number) {
  const timeFilter = new TimeRangeFilter(startTime, endTime);
  const metrics = performanceLogger.getEvents(timeFilter);
  
  // Aggregate metrics
  const analysis = metrics.reduce((acc, event) => {
    const { metric, value } = event.details as any;
    if (!acc[metric]) {
      acc[metric] = {
        count: 0,
        total: 0,
        min: value,
        max: value
      };
    }
    
    acc[metric].count++;
    acc[metric].total += value;
    acc[metric].min = Math.min(acc[metric].min, value);
    acc[metric].max = Math.max(acc[metric].max, value);
    
    return acc;
  }, {});
  
  return analysis;
}
```

These examples demonstrate the main features of ActionLogger. In practice, you can combine and customize these examples according to your application's requirements.