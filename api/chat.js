const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

function getConfig() {
    try {
        const value = JSON.parse(process.env.AI_CONFIG || '{}');
        return {
            apiKey: String(value.apiKey || ''),
            baseUrl: String(value.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, ''),
            model: String(value.model || 'gpt-4o-mini')
        };
    } catch (error) {
        return null;
    }
}

function getEgg(password) {
    try {
        const eggs = JSON.parse(process.env.EASTER_EGGS || '{}');
        const egg = Object.prototype.hasOwnProperty.call(eggs, password) && eggs[password];
        return egg && typeof egg === 'object' ? egg : null;
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

    const egg = typeof body.password === 'string' && getEgg(body.password);
    if (!Array.isArray(body.messages)) return egg
        ? res.status(200).json({ unlocked: true, title: String(egg.title || ''), greeting: String(egg.greeting || '') })
        : res.status(404).json({ unlocked: false });
    if (!egg) return res.status(404).json({ error: 'Not found' });

    const messages = body.messages.filter(item => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string')
        .slice(-40).map(item => ({ role: item.role, content: item.content.slice(0, 2000) }));
    if (!messages.length) return res.status(400).json({ error: 'Message is required' });
    const greeting = String(egg.greeting || '').trim();
    const prompt = [String(egg.prompt || '').trim(), greeting && `已向用户展示的开场白：${greeting}`].filter(Boolean).join('\n\n');
    const requestMessages = prompt
        ? [{ role: 'system', content: prompt }, ...messages]
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
