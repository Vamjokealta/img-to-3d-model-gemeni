/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LogEntry } from '../types';

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    this.info('ImageTo3D Logger initialized in offline mode.');
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const current = [...this.logs];
    for (const listener of this.listeners) {
      listener(current);
    }
  }

  private addEntry(level: LogEntry['level'], message: string, details?: string): void {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
      details,
    };

    this.logs.push(entry);
    if (this.logs.length > 500) {
      this.logs.shift();
    }

    if (level === 'error') {
      console.error(`[ImageTo3D] ${message}`, details || '');
    } else if (level === 'warn') {
      console.warn(`[ImageTo3D] ${message}`, details || '');
    } else {
      console.log(`[ImageTo3D] ${message}`, details || '');
    }

    this.notify();
  }

  public info(message: string, details?: string): void {
    this.addEntry('info', message, details);
  }

  public warn(message: string, details?: string): void {
    this.addEntry('warn', message, details);
  }

  public error(message: string, details?: string): void {
    this.addEntry('error', message, details);
  }

  public success(message: string, details?: string): void {
    this.addEntry('success', message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
    this.notify();
  }

  public exportLogsAsText(): string {
    return this.logs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}${l.details ? ` - ${l.details}` : ''}`)
      .join('\n');
  }
}

export const logger = new LoggerService();
