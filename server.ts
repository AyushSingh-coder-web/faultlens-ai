import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google GenAI client if API key is present
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Health / Status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    platform: 'FaultLens AI Engine',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Optional Gemini-powered SRE Incident Narrative generation
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { incident, rootCause, affectedServices, logsSample, recoveryStrategy } = req.body;

    if (!ai) {
      return res.status(200).json({
        available: false,
        source: 'rule-engine-fallback',
        summary: 'Gemini API key is not configured in environment. The platform will use deterministic rule-based analysis.',
      });
    }

    const prompt = `You are a Principal Site Reliability Engineer and AI Systems Architect reviewing a cascading failure incident in a distributed microservices cluster.

Incident Data:
- Incident ID: ${incident?.id || 'N/A'}
- Scenario: ${incident?.scenarioTitle || incident?.scenarioId || 'Cascading Outage'}
- Trigger Service: ${incident?.rootService || 'N/A'}
- Estimated Severity: ${incident?.severity || 'CRITICAL'}
- Suspected Root Cause: ${rootCause?.probableCause || 'Under investigation'}
- Confidence: ${rootCause?.confidence || 0}%
- Propagation Path: ${(incident?.propagationPath || []).join(' -> ') || 'N/A'}
- Affected Services: ${(affectedServices || []).map((s: any) => `${s.name} (Risk: ${s.riskScore}, State: ${s.state})`).join(', ')}
- Selected Recovery Strategy: ${recoveryStrategy?.title || 'None selected'}

Key Telemetry / Logs Snippet:
${(logsSample || []).slice(0, 8).map((l: any) => `[${l.timestamp}] [${l.severity}] [${l.service}] ${l.message}`).join('\n')}

Please generate a structured, highly professional SRE Incident Briefing:
1. Executive Summary: 2-3 sentences explaining what happened and why it cascaded.
2. Propagation Breakdown: Explain how the failure traveled across the dependency graph.
3. Root Cause Hypothesis: Explain the physical bottleneck (e.g. connection starvation, thread pool saturation, backpressure).
4. Recovery Evaluation: Assess the chosen recovery strategy (${recoveryStrategy?.title || 'suggested strategy'}) and any risks/tradeoffs.
5. Long-term Architectural Prevention: 2 concrete architectural hardening recommendations (e.g., circuit breaking with Polly/Resilience4j, bulkhead isolation, adaptive timeout tuning).

Keep the tone authoritative, concise, and focused on distributed systems engineering.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.status(200).json({
      available: true,
      source: 'gemini-3.8-flash',
      narrative: response.text,
    });
  } catch (error: any) {
    console.error('Gemini explanation error:', error?.message);
    return res.status(200).json({
      available: false,
      source: 'rule-engine-fallback',
      error: error?.message || 'Failed to generate AI narrative',
    });
  }
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FaultLens AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
