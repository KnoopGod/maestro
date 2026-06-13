#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * MAESTRO MCP Server — exposes MAESTRO AI tools to Claude Desktop
 */
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
// stdout is reserved for JSON-RPC — log to stderr
const log = (...args) => process.stderr.write(args.join(' ') + '\n');
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
const TASK_PATTERNS = {
    image: /image|photo|visuel|bannière|logo|illustration/i,
    code: /code|programme|fonction|script|bug|typescript|javascript|python|react/i,
    strategy: /stratégie|architecture|plan|analyse|vision|roadmap/i,
};
function detectBestAI(prompt) {
    if (TASK_PATTERNS.image.test(prompt))
        return 'chatgpt';
    return 'claude';
}
const server = new index_js_1.Server({ name: 'maestro-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'route_task',
            description: 'Route automatiquement une tâche vers Claude ou ChatGPT selon le type de tâche.',
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string', description: 'La tâche ou question à traiter' },
                    force_ai: {
                        type: 'string',
                        enum: ['claude', 'chatgpt'],
                        description: 'Forcer une IA spécifique (optionnel)',
                    },
                },
                required: ['prompt'],
            },
        },
        {
            name: 'estimate_cost',
            description: "Estime le coût d'une tâche selon l'IA choisie.",
            inputSchema: {
                type: 'object',
                properties: {
                    prompt: { type: 'string', description: 'Le prompt pour estimer les tokens' },
                    ai: { type: 'string', enum: ['claude', 'chatgpt'], description: 'IA à évaluer' },
                },
                required: ['prompt', 'ai'],
            },
        },
    ],
}));
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        if (name === 'route_task') {
            const prompt = args?.prompt;
            const forceAI = args?.force_ai;
            const chosenAI = forceAI ?? detectBestAI(prompt);
            const reason = forceAI ? 'Choix manuel' : `Détection automatique → ${chosenAI}`;
            const result = chosenAI === 'chatgpt' ? await callChatGPT(prompt) : await callClaude(prompt);
            return {
                content: [{
                        type: 'text',
                        text: [
                            `## Résultat — ${result.ai.toUpperCase()}`,
                            `**Routing** : ${reason}`,
                            `**Modèle** : ${result.model}`,
                            `**Tokens** : ${result.tokens} | **Coût** : $${result.cost.toFixed(5)}`,
                            '',
                            result.response,
                        ].join('\n'),
                    }],
            };
        }
        if (name === 'estimate_cost') {
            const prompt = args?.prompt;
            const ai = args?.ai;
            const estimatedTokens = Math.ceil(prompt.length / 4) * 2;
            const costs = {
                claude: { price: (estimatedTokens * 9) / 1_000_000, label: '$3/1M input + $15/1M output' },
                chatgpt: { price: (estimatedTokens * 6.25) / 1_000_000, label: '$2.5/1M input + $10/1M output' },
            };
            const c = costs[ai];
            return {
                content: [{
                        type: 'text',
                        text: [
                            `## Estimation coût — ${ai.toUpperCase()}`,
                            `**Tokens estimés** : ~${estimatedTokens}`,
                            `**Tarif** : ${c.label}`,
                            `**Coût estimé** : $${c.price.toFixed(5)}`,
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
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    log('MAESTRO MCP server démarré');
}
main().catch((err) => process.stderr.write(String(err) + '\n'));
