const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

function getConfig() {
    try {
        const value = JSON.parse(process.env.AI_CONFIG || '{}');
        return {
            apiKey: String(value.apiKey || ''),
            baseUrl: String(value.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ''),
            model: String(value.model || 'gpt-4o-mini'),
            systemPrompt: String(value.systemPrompt || '').trim(),
            password: String(value.password || '')
        };
    } catch (error) {
        return null;
    }
}

module.exports = async function chat(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const config = getConfig();
    if (!config || !config.apiKey) return res.status(503).json({ error: 'AI is not configured' });

    let body;
    try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (error) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    if (typeof body.password === 'string') {
        const unlocked = Boolean(config.password && body.password === config.password);
        return res.status(unlocked ? 200 : 404).json({ unlocked });
    }

    const messages = Array.isArray(body.messages)
        ? body.messages.filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
            .slice(-40).map(item => ({ role: item.role, content: item.content.slice(0, 2000) }))
        : [];
    if (!messages.length) return res.status(400).json({ error: 'Message is required' });
    const requestMessages = config.systemPrompt
        ? [{ role: 'system', content: config.systemPrompt }, ...messages]
        : messages;

    try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
            body: JSON.stringify({ model: config.model, messages: requestMessages, stream: false, max_tokens: 2048 })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return res.status(response.status === 429 ? 429 : 502).json({ error: 'AI request failed' });
        const content = data.choices?.[0]?.message?.content;
        const reply = Array.isArray(content) ? content.map(item => item.text || '').join('') : content;
        if (typeof reply !== 'string' || !reply.trim()) return res.status(502).json({ error: 'Empty AI response' });
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ reply: reply.trim() });
    } catch (error) {
        return res.status(502).json({ error: 'AI request failed' });
    }
};
