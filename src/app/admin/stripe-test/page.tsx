'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface LogEntry {
  id: string;
  type: 'request' | 'response' | 'error' | 'info';
  timestamp: Date;
  title: string;
  content: string;
  status?: 'OK' | 'ERROR';
}

export default function StripeTestPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  const addLog = useCallback(
    (
      type: LogEntry['type'],
      title: string,
      content: string,
      status?: 'OK' | 'ERROR'
    ) => {
      const newLog: LogEntry = {
        id: Math.random().toString(36),
        type,
        timestamp: new Date(),
        title,
        content,
        status,
      };
      setLogs((prev) => [...prev, newLog]);
    },
    []
  );

  // Helper to make API calls with logging
  const makeApiCall = useCallback(
    async (
      method: string,
      endpoint: string,
      title: string,
      payload?: unknown
    ) => {
      setIsLoading(true);
      if (payload) {
        addLog('request', `${method} ${endpoint}`, JSON.stringify(payload, null, 2));
      } else {
        addLog('request', `${method} ${endpoint}`, `Fetching from ${endpoint}`);
      }

      try {
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          ...(payload && { body: JSON.stringify(payload) }),
        });

        const data = await response.json();

        if (response.ok) {
          addLog('response', title, JSON.stringify(data, null, 2), 'OK');
        } else {
          addLog('error', title, JSON.stringify(data, null, 2), 'ERROR');
        }
      } catch (error) {
        addLog('error', title, String(error), 'ERROR');
      } finally {
        setIsLoading(false);
      }
    },
    [addLog]
  );

  const testCreatePaymentIntent = useCallback(() => {
    const payload = {
      organizationId: 'default-org',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phoneNumber: '+15551234567',
      amount: 5000,
      registrationType: 'YOUTH',
      eventId: 'test-event-123',
    };
    makeApiCall('POST', '/api/payments/create-intent', 'Payment Intent Created', payload);
  }, [makeApiCall]);

  const testListRegistrations = useCallback(() => {
    makeApiCall('GET', '/api/registrations', 'Registrations Retrieved');
  }, [makeApiCall]);

  const testPaymentStatus = useCallback(() => {
    makeApiCall('GET', '/api/registrations?status=pending', 'Payment Status Check');
  }, [makeApiCall]);

  const testDatabaseConnection = useCallback(async () => {
    setIsLoading(true);
    addLog('request', 'Database Health Check', 'Attempting to query registrations');
    try {
      const response = await fetch('/api/registrations');
      if (response.ok) {
        addLog('response', 'Database Connected', 'Successfully connected to database', 'OK');
      } else {
        addLog('error', 'Database Error', `HTTP ${response.status}`, 'ERROR');
      }
    } catch (error) {
      addLog('error', 'Connection Failed', String(error), 'ERROR');
    } finally {
      setIsLoading(false);
    }
  }, [addLog]);

  const testStripeKeys = useCallback(() => {
    const payload = {
      organizationId: 'default-org',
      firstName: 'Key',
      lastName: 'Test',
      email: 'keytest@example.com',
      phoneNumber: '+15551234567',
      amount: 100,
      registrationType: 'ADULT',
    };
    makeApiCall('POST', '/api/payments/create-intent', 'Stripe Keys Valid', payload);
  }, [makeApiCall]);

  const testWebhookSignature = useCallback(() => {
    addLog(
      'info',
      'Webhook Test',
      'Webhook signature verification is handled server-side at /api/webhooks/stripe. Use Stripe CLI to send authentic test events:\nstripe trigger payment_intent.succeeded',
      'OK'
    );
  }, [addLog]);

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logText = logs
      .map(
        (log) =>
          `[${log.timestamp.toISOString()}] ${log.type.toUpperCase()} - ${log.title}\n${log.content}`
      )
      .join('\n\n---\n\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logText));
    element.setAttribute('download', `stripe-test-logs-${new Date().toISOString()}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-3">
          <h1 className="text-2xl font-bold text-white mb-1">Stripe Integration Tester</h1>
          <p className="text-slate-400 text-xs">Test your Stripe API integration with one-click commands</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Test Controls */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <h2 className="text-sm font-semibold text-white mb-3">Test Commands</h2>
              <div className="space-y-2">
                <button
                  onClick={testStripeKeys}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                >
                  🔐 Test Keys
                </button>

                <button
                  onClick={testDatabaseConnection}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                >
                  🗄️ Test DB
                </button>

                <button
                  onClick={testCreatePaymentIntent}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                >
                  💳 Create Intent
                </button>

                <button
                  onClick={testListRegistrations}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                >
                  📋 List Regs
                </button>

                <button
                  onClick={testPaymentStatus}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                >
                  ✓ Check Status
                </button>

                <button
                  onClick={testWebhookSignature}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                >
                  🔔 Webhook Test
                </button>

                <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
                  <button
                    onClick={downloadLogs}
                    className="w-full px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                  >
                    ⬇️ Download Logs
                  </button>

                  <button
                    onClick={clearLogs}
                    className="w-full px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-all duration-200 text-xs"
                  >
                    🗑️ Clear Logs
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Console/Logs Display */}
          <div className="lg:col-span-3">
            <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden flex flex-col h-[500px]">
              {/* Console Header */}
              <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <h3 className="text-white font-mono text-xs">stripe_test @ localhost:3000</h3>
                <div className="text-slate-400 text-xs">{logs.length} events</div>
              </div>

              {/* Console Logs */}
              <div className="flex-1 overflow-y-auto font-mono text-xs bg-slate-950 p-3 space-y-3">
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-center mt-8">
                    <p>No activity yet. Click a test button to get started.</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">{log.timestamp.toLocaleTimeString()}</span>
                        {log.status && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              log.status === 'OK'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {log.status}
                          </span>
                        )}
                      </div>

                      <div
                        className={`font-semibold ${
                          log.type === 'request'
                            ? 'text-blue-400'
                            : log.type === 'response'
                              ? 'text-green-400'
                              : log.type === 'error'
                                ? 'text-red-400'
                                : 'text-yellow-400'
                        }`}
                      >
                        {log.title}
                      </div>

                      <pre className="bg-slate-800 rounded p-2 overflow-x-auto text-slate-300 text-xs whitespace-pre-wrap break-words">
                        {log.content}
                      </pre>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
            <h3 className="font-semibold text-white mb-1 text-xs">🔐 Keys Check</h3>
            <p className="text-xs text-slate-400">
              Verify your Stripe API keys are loaded from .env.local
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
            <h3 className="font-semibold text-white mb-1 text-xs">💳 Payment Intent</h3>
            <p className="text-xs text-slate-400">
              Create a test payment intent with fake registration data
            </p>
          </div>

          <div className="bg-slate-800 rounded-lg border border-slate-700 p-3">
            <h3 className="font-semibold text-white mb-1 text-xs">🔔 Webhook Ready</h3>
            <p className="text-xs text-slate-400">
              Use Stripe CLI to forward webhooks: <code className="text-[10px]">stripe listen --forward-to localhost:3000/api/webhooks/stripe</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
