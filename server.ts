/**
 * Smart Electricity Bill Calculator Using C
 * server.ts - Full-Stack Express Server & C Engine Bridge
 */

import express from 'express';
import { execFile, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx !== -1 ? Number(process.argv[portArgIdx + 1]) : NaN;
const envPort = process.env.PORT && process.env.PORT !== process.env.NGINX_PORT ? Number(process.env.PORT) : NaN;
const PORT = (!Number.isNaN(cliPort) && cliPort > 0 ? cliPort : 0) ||
  (!Number.isNaN(envPort) && envPort > 0 ? envPort : 0) ||
  Number(process.env.DEFAULT_APP_PORT) ||
  3000;
const C_BINARY = path.join(__dirname, 'smart_bill_calculator');

app.use(express.json({ limit: '10mb' }));

// Helper to run C binary
function runCBinary(args: string[], stdinInput?: string): Promise<{ stdout: string; stderr: string; executionTimeMs: number }> {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const child = execFile(C_BINARY, args, (err, stdout, stderr) => {
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
      if (err && !stdout) {
        return reject(new Error(stderr || err.message));
      }
      resolve({ stdout, stderr, executionTimeMs });
    });

    if (stdinInput && child.stdin) {
      child.stdin.write(stdinInput);
      child.stdin.end();
    }
  });
}

// API: Calculate Bill via C Backend
app.post('/api/calculate', async (req, res) => {
  try {
    const payload = JSON.stringify(req.body);
    const { stdout, executionTimeMs } = await runCBinary(['--calculate', payload]);
    const parsed = JSON.parse(stdout);
    parsed.executionTimeMs = executionTimeMs;
    res.json(parsed);
  } catch (error: any) {
    console.error('C Calculation error:', error);
    res.status(500).json({ status: 'error', message: error.message || 'Calculation failed' });
  }
});

// API: Get History from C file storage
app.get('/api/history', async (_req, res) => {
  try {
    const { stdout, executionTimeMs } = await runCBinary(['--history']);
    const parsed = JSON.parse(stdout);
    parsed.executionTimeMs = executionTimeMs;
    res.json(parsed);
  } catch (error: any) {
    console.error('History fetch error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Save Record to C DB
app.post('/api/save-record', async (req, res) => {
  try {
    const payload = JSON.stringify(req.body);
    const { stdout, executionTimeMs } = await runCBinary(['--save', payload]);
    const parsed = JSON.parse(stdout);
    parsed.executionTimeMs = executionTimeMs;
    res.json(parsed);
  } catch (error: any) {
    console.error('Save error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Delete Record from C DB (CSV & Binary)
app.post('/api/delete-record', async (req, res) => {
  try {
    const billId = typeof req.body?.billId === 'string' ? req.body.billId.trim() : '';
    if (!billId) {
      return res.status(400).json({ status: 'error', message: 'Valid billId is required' });
    }
    const rowIndex = Number.isInteger(req.body?.rowIndex) ? req.body.rowIndex : -1;
    const payload = JSON.stringify({ billId, rowIndex });
    const { stdout, executionTimeMs } = await runCBinary(['--delete', payload]);
    const parsed = JSON.parse(stdout);
    parsed.executionTimeMs = executionTimeMs;
    res.json(parsed);
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Compare Tariffs
app.get('/api/compare-tariffs', async (req, res) => {
  try {
    const units = String(req.query.units || '300');
    const category = String(req.query.category || 'Domestic');
    const { stdout, executionTimeMs } = await runCBinary(['--compare-tariffs', units, category]);
    const parsed = JSON.parse(stdout);
    parsed.executionTimeMs = executionTimeMs;
    res.json(parsed);
  } catch (error: any) {
    console.error('Tariff comparison error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// API: Fetch C Source Code for Lab Inspection & Academic Review
app.get('/api/c-code', (_req, res) => {
  try {
    const cFiles = [
      { name: 'types.h', path: path.join(__dirname, 'c_src/types.h'), desc: 'Data structures, structs for slabs, bills, appliances, prediction' },
      { name: 'billing.c', path: path.join(__dirname, 'c_src/billing.c'), desc: 'Slab-wise tier rates, energy duty, fuel surcharge, fixed charges' },
      { name: 'billing.h', path: path.join(__dirname, 'c_src/billing.h'), desc: 'Billing header prototypes' },
      { name: 'appliances.c', path: path.join(__dirname, 'c_src/appliances.c'), desc: 'Appliance power auditor, consumption, what-if simulator' },
      { name: 'appliances.h', path: path.join(__dirname, 'c_src/appliances.h'), desc: 'Appliance header prototypes' },
      { name: 'history.c', path: path.join(__dirname, 'c_src/history.c'), desc: 'C File I/O (fopen, fread, fwrite), binary & CSV databases, anomaly detection' },
      { name: 'history.h', path: path.join(__dirname, 'c_src/history.h'), desc: 'History header prototypes' },
      { name: 'prediction.c', path: path.join(__dirname, 'c_src/prediction.c'), desc: 'Statistical least-squares linear regression & moving trend forecast' },
      { name: 'prediction.h', path: path.join(__dirname, 'c_src/prediction.h'), desc: 'Prediction header prototypes' },
      { name: 'recommendations.c', path: path.join(__dirname, 'c_src/recommendations.c'), desc: 'Rule-based expert recommendation engine for electricity savings' },
      { name: 'recommendations.h', path: path.join(__dirname, 'c_src/recommendations.h'), desc: 'Recommendations header prototypes' },
      { name: 'main.c', path: path.join(__dirname, 'c_src/main.c'), desc: 'CLI driver, JSON API bridge, and interactive terminal interface' },
    ];

    const files = cFiles.map(f => {
      let content = '';
      try {
        content = fs.readFileSync(f.path, 'utf8');
      } catch (e) {
        content = '// File not found';
      }
      return {
        name: f.name,
        description: f.desc,
        lines: content.split('\n').length,
        content,
      };
    });

    res.json({ files, compiler: 'gcc 12.3.0 (Ubuntu)', buildFlags: '-Wall -Wextra -O2 -lm' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API: Run C Terminal Demo CLI
app.post('/api/run-c-cli', async (req, res) => {
  try {
    const mode = req.body.mode || '--demo';
    const { stdout, stderr, executionTimeMs } = await runCBinary([mode]);
    res.json({ output: stdout || stderr, executionTimeMs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  // Ensure C binary exists and is executable (file snapshots may strip +x)
  if (fs.existsSync(C_BINARY)) {
    try {
      fs.chmodSync(C_BINARY, 0o755);
    } catch (e) {
      console.warn('Could not chmod C binary:', e);
    }
  } else {
    console.log('Compiling C backend binary smart_bill_calculator...');
    try {
      await new Promise((resolve, reject) => {
        exec('gcc -Wall -Wextra -O2 c_src/*.c -o smart_bill_calculator -lm', { cwd: __dirname }, (err, stdout, stderr) => {
          if (err) return reject(new Error(stderr || err.message));
          resolve(stdout);
        });
      });
      fs.chmodSync(C_BINARY, 0o755);
      console.log('C binary successfully compiled.');
    } catch (e) {
      console.error('Failed to compile C binary:', e);
    }
  }

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Electricity Bill Calculator (C Engine) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
