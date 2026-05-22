#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * AI Command Center — MCP Server pour Claude Desktop
 * Expose les outils de routing IA directement dans Claude Desktop
 */
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const ollama_1 = require("ollama");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
// stdout est réservé au protocole JSON-RPC — tout log va sur stderr
const log = (...args) => process.stderr.write(args.join(' ') + '\n');
// ── Clients IA ───────────────────────────────────────────────────────────────
const ollama = new ollama_1.Ollama({ host: 'http://localhost:11434' });
function getAnthropic() {
    if (!process.env.ANTHROPIC_API_KEY)
        throw new Error('ANTHROPIC_API_KEY manquante');
    return new sdk_1.default({ apiKey: process.env.ANTHROPIC_API_KEY });
}
function getOpenAI() {
    if (!process.env.OPENAI_API_KEY)
        throw new Error('OPENAI_API_KEY manquante');
    return new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
}
// ── Détection automatique de tâche ───────────────────────────────────────────
const TASK_PATTERNS = {
    image: /image|photo|visuel|bannière|logo|illustration/i,
    code: /code|programme|fonction|script|bug|typescript|javascript|python|react/i,
    strategy: /stratégie|architecture|plan|analyse|vision|roadmap/i,
    simple: /résume|reformule|hashtag|variante|brouillon|liste|traduis/i,
};
function detectBestAI(prompt) {
    if (TASK_PATTERNS.image.test(prompt))
        return 'chatgpt';
    if (TASK_PATTERNS.code.test(prompt))
        return 'claude';
    if (TASK_PATTERNS.strategy.test(prompt))
        return 'claude';
    if (TASK_PATTERNS.simple.test(prompt))
        return 'ollama';
    return 'ollama';
}
// ── Appels IA ────────────────────────────────────────────────────────────────
async function callOllama(prompt, model = 'llama3.2:3b') {
    const res = await ollama.chat({ model, messages: [{ role: 'user', content: prompt }] });
    return {
        response: res.message.content,
        tokens: res.eval_count ?? 0,
        cost: 0,
        ai: 'ollama',
        model,
    };
}
async function callClaude(prompt) {
    const client = getAnthropic();
    const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
    const cost = (msg.usage.input_tokens * 3 + msg.usage.output_tokens * 15) / 1_000_000;
    return { response: text, tokens: msg.usage.input_tokens + msg.usage.output_tokens, cost, ai: 'claude', model: 'claude-sonnet-4-6' };
}
async function callChatGPT(prompt) {
    const client = getOpenAI();
    const res = await client.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
    });
    const text = res.choices[0]?.message?.content ?? '';
    const i = res.usage?.prompt_tokens ?? 0;
    const o = res.usage?.completion_tokens ?? 0;
    const cost = (i * 2.5 + o * 10) / 1_000_000;
    return { response: text, tokens: i + o, cost, ai: 'chatgpt', model: 'gpt-4o' };
}
// ── Serveur MCP ───────────────────────────────────────────────────────────────
const server = new index_js_1.Server({ name: 'ai-command-center', version: '1.0.0' }, { capabilities: { tools: {} } });
// Liste des outils disponibles
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'route_task',
            description: 'Route automatiquement une tâche vers la meilleure IA (Claude, ChatGPT ou Ollama) selon le type de tâche. Utilise le mode Hybride : Ollama pour les tâches simples, Claude pour la stratégie/code, ChatGPT pour le visuel.',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string', description: 'La tâche ou question à traiter' },
                    force_ai: {
                        type: 'string',
                        enum: ['claude', 'chatgpt', 'ollama'],
                        description: 'Forcer une IA spécifique (optionnel)',
                    },
                },
                required: ['prompt'],
            },
        },
        {
            name: 'call_ollama',
            description: 'Appelle directement Ollama (IA locale, gratuite, 0 token Claude). Idéal pour les brouillons, résumés, hashtags, reformulations, et toute tâche simple pour économiser les tokens.',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string', description: 'La tâche à traiter' },
                    model: { type: 'string', description: 'Modèle Ollama (défaut: llama3.2:3b)', default: 'llama3.2:3b' },
                },
                required: ['prompt'],
            },
        },
        {
            name: 'get_ai_status',
            description: 'Retourne le statut en temps réel de toutes les IAs : Ollama (local), Claude API, ChatGPT API. Indique quelles IAs sont actives, configurées ou indisponibles.',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'list_ollama_models',
            description: 'Liste tous les modèles Ollama téléchargés et disponibles localement.',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'estimate_cost',
            description: 'Estime le coût d\'une tâche selon l\'IA choisie. Compare Claude vs ChatGPT vs Ollama (gratuit).',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string', description: 'Le prompt pour estimer les tokens' },
                    ai: { type: 'string', enum: ['claude', 'chatgpt', 'ollama'], description: 'IA à évaluer' },
                },
                required: ['prompt', 'ai'],
            },
        },
    ],
}));
// Exécution des outils
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        // ── route_task ────────────────────────────────────────────────────────────
        if (name === 'route_task') {
            const prompt = args?.prompt;
            const forceAI = args?.force_ai;
            const chosenAI = forceAI ?? detectBestAI(prompt);
            const reason = forceAI ? 'Choix manuel' : `Détection automatique → ${chosenAI}`;
            let result;
            try {
                if (chosenAI === 'claude')
                    result = await callClaude(prompt);
                else if (chosenAI === 'chatgpt')
                    result = await callChatGPT(prompt);
                else
                    result = await callOllama(prompt);
            }
            catch {
                result = await callOllama(prompt);
                result.response = `[Fallback Ollama — ${chosenAI} indisponible]\n\n${result.response}`;
            }
            return {
                content: [{
                        type: 'text',
                        text: [
                            `## Résultat — ${result.ai.toUpperCase()}`,
                            `**Routing** : ${reason}`,
                            `**Modèle** : ${result.model}`,
                            `**Tokens** : ${result.tokens} | **Coût** : ${result.cost === 0 ? 'GRATUIT 🟢' : `$${result.cost.toFixed(5)}`}`,
                            '',
                            result.response,
                        ].join('\n'),
                    }],
            };
        }
        // ── call_ollama ───────────────────────────────────────────────────────────
        if (name === 'call_ollama') {
            const prompt = args?.prompt;
            const model = args?.model || 'llama3.2:3b';
            const result = await callOllama(prompt, model);
            return {
                content: [{
                        type: 'text',
                        text: [
                            `## Ollama (${model}) — GRATUIT 🟢`,
                            `**Tokens** : ${result.tokens}`,
                            '',
                            result.response,
                        ].join('\n'),
                    }],
            };
        }
        // ── get_ai_status ─────────────────────────────────────────────────────────
        if (name === 'get_ai_status') {
            const ollamaModels = await ollama.list().then(r => r.models.map((m) => m.name)).catch(() => []);
            const lines = [
                '## Statut AI Command Center',
                '',
                `🏠 **Ollama Local** : ${ollamaModels.length > 0 ? '✅ ACTIF' : '❌ Inactif'}`,
                `   Modèles : ${ollamaModels.join(', ') || 'aucun'}`,
                '',
                `👑 **Claude API** : ${process.env.ANTHROPIC_API_KEY ? '🔑 Clé configurée' : '❌ Clé manquante'}`,
                `   Modèle : claude-sonnet-4-6`,
                '',
                `🎨 **ChatGPT API** : ${process.env.OPENAI_API_KEY ? '🔑 Clé configurée' : '❌ Clé manquante'}`,
                `   Modèle : gpt-4o`,
            ];
            return { content: [{ type: 'text', text: lines.join('\n') }] };
        }
        // ── list_ollama_models ────────────────────────────────────────────────────
        if (name === 'list_ollama_models') {
            const list = await ollama.list();
            const models = list.models.map((m) => `- **${m.name}** (${(m.size / 1e9).toFixed(1)} Go)`);
            return {
                content: [{
                        type: 'text',
                        text: ['## Modèles Ollama disponibles', '', ...models].join('\n'),
                    }],
            };
        }
        // ── estimate_cost ─────────────────────────────────────────────────────────
        if (name === 'estimate_cost') {
            const prompt = args?.prompt;
            const ai = args?.ai;
            const estimatedTokens = Math.ceil(prompt.length / 4) * 2; // estimation grossière
            const costs = {
                claude: { price: (estimatedTokens * 9) / 1_000_000, label: '$3/1M input + $15/1M output' },
                chatgpt: { price: (estimatedTokens * 6.25) / 1_000_000, label: '$2.5/1M input + $10/1M output' },
                ollama: { price: 0, label: 'Gratuit — local' },
            };
            const c = costs[ai];
            return {
                content: [{
                        type: 'text',
                        text: [
                            `## Estimation coût — ${ai.toUpperCase()}`,
                            `**Tokens estimés** : ~${estimatedTokens}`,
                            `**Tarif** : ${c.label}`,
                            `**Coût estimé** : ${c.price === 0 ? 'GRATUIT 🟢' : `$${c.price.toFixed(5)}`}`,
                            '',
                            ai !== 'ollama' ? `💡 *Même résultat avec Ollama : GRATUIT*` : '✅ *Choix optimal — aucun coût*',
                        ].join('\n'),
                    }],
            };
        }
        return { content: [{ type: 'text', text: `Outil inconnu : ${name}` }] };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `Erreur : ${msg}` }], isError: true };
    }
});
// Démarrage
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    log('AI Command Center MCP server démarré');
}
main().catch((err) => process.stderr.write(String(err) + '\n'));
