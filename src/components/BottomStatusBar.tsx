/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Cpu,
  Layers,
  Terminal,
  Trash2,
  Zap,
} from 'lucide-react';
import { DepthMapData, LogEntry, MeshStats, ModelMetadata } from '../types';
import { logger } from '../services/logger';

interface BottomStatusBarProps {
  meshStats: MeshStats;
  depthMap: DepthMapData | null;
  modelMetadata: ModelMetadata;
  isProcessing: boolean;
}

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  meshStats,
  depthMap,
  modelMetadata,
  isProcessing,
}) => {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'success'>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  const handleCopyLogs = () => {
    const text = logger.exportLogsAsText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'all') return true;
    return log.level === filterLevel;
  });

  return (
    <footer
      id="bottom-status-bar"
      className="bg-[#12151a] border-t border-[#262c36] flex flex-col shrink-0 text-gray-400 select-none z-20 text-xs"
    >
      {/* Expandable Console Drawer */}
      {isConsoleOpen && (
        <div className="h-56 bg-[#0e1116] border-b border-[#262c36] flex flex-col font-mono text-[11px]">
          <div className="h-8 bg-[#161a22] px-3 flex items-center justify-between border-b border-[#262c36] text-gray-300">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-xs">Application Console Logs</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#252c38] rounded text-gray-400">
                {logs.length} entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Pills */}
              <div className="flex bg-[#0e1116] rounded p-0.5 border border-[#262c36]">
                {(['all', 'info', 'warn', 'error', 'success'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilterLevel(lvl)}
                    className={`px-2 py-0.5 rounded capitalize text-[10px] ${
                      filterLevel === lvl ? 'bg-blue-600 text-white font-semibold' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCopyLogs}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#202734] hover:bg-[#2c3647] text-gray-300 text-[10px]"
                title="Copy logs to clipboard"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={() => logger.clear()}
                className="p-1 rounded hover:bg-[#202734] text-gray-400 hover:text-red-400"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-2 overflow-y-auto custom-scrollbar space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-gray-600 text-center py-4">No console logs recorded.</div>
            ) : (
              filteredLogs.map((log) => {
                let badgeColor = 'text-blue-400 bg-blue-950/40 border-blue-800/40';
                if (log.level === 'warn') badgeColor = 'text-amber-400 bg-amber-950/40 border-amber-800/40';
                if (log.level === 'error') badgeColor = 'text-rose-400 bg-rose-950/40 border-rose-800/40';
                if (log.level === 'success') badgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';

                return (
                  <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-gray-500 shrink-0 text-[10px]">{log.timestamp}</span>
                    <span className={`px-1 rounded text-[9px] uppercase border font-semibold shrink-0 ${badgeColor}`}>
                      {log.level}
                    </span>
                    <span className="text-gray-200">{log.message}</span>
                    {log.details && <span className="text-gray-500 truncate">({log.details})</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Main Status Bar */}
      <div className="h-7 px-3 flex items-center justify-between">
        {/* Left Status: Vertices & Faces */}
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Vertices:</span>
            <span className="font-mono text-gray-200 font-semibold">
              {meshStats.vertexCount.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>Triangles:</span>
            <span className="font-mono text-gray-200 font-semibold">
              {meshStats.triangleCount.toLocaleString()}
            </span>
          </div>

          {meshStats.estimatedMemoryBytes > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-gray-500">
              <span>Mesh RAM:</span>
              <span className="font-mono text-gray-300">
                {(meshStats.estimatedMemoryBytes / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>

        {/* Center / Right: Hardware & Backend status */}
        <div className="flex items-center gap-3 text-[11px]">
          {isProcessing ? (
            <div className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>Processing Depth Tensor...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-gray-500">AI Backend:</span>
              <span className="font-mono text-purple-300 bg-purple-950/40 border border-purple-800/40 px-1.5 py-0.2 rounded text-[10px]">
                {depthMap ? depthMap.backendUsed.toUpperCase() : 'WASM/GPU'}
              </span>
            </div>
          )}

          <div className="h-3 w-px bg-[#262c36]" />

          {/* Offline Security Badge */}
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">100% Local & Offline</span>
          </div>

          <div className="h-3 w-px bg-[#262c36]" />

          {/* Toggle Console Button */}
          <button
            onClick={() => setIsConsoleOpen((open) => !open)}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-200 px-1 py-0.5 rounded hover:bg-[#1a1f29]"
            title="Toggle Console Output"
          >
            <Terminal className="w-3 h-3 text-blue-400" />
            <span>Console</span>
            {isConsoleOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </footer>
  );
};
