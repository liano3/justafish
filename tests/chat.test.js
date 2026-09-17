const { test } = require('node:test');
const assert = require('node:assert/strict');
const chat = require('../api/chat');

test('chat validates requests and forwards only supported messages', async t => {
    const config = process.env.AI_CONFIG;
    const eggs = process.env.EASTER_EGGS;
    process.env.AI_CONFIG = JSON.stringify({ apiKey: 'test-key', model: 'test-model' });
    process.env.EASTER_EGGS = JSON.stringify({ test: { title: 'Test', greeting: 'Hello', prompt: 'Be helpful' } });
    t.after(() => {
        if (config === undefined) delete process.env.AI_CONFIG; else process.env.AI_CONFIG = config;
        if (eggs === undefined) delete process.env.EASTER_EGGS; else process.env.EASTER_EGGS = eggs;
    });
    const requests = [];
    t.mock.method(global, 'fetch', async (url, options) => {
        requests.push({ url, body: JSON.parse(options.body), signal: options.signal });
        return { ok: true, json: async () => ({ choices: [{ message: { content: ' Test reply ' } }] }) };
    });
    const request = async (body, method = 'POST') => {
        const res = {
            statusCode: 200, headers: {},
            status(code) { this.statusCode = code; return this; },
            json(value) { this.body = value; return this; },
            setHeader(name, value) { this.headers[name] = value; }
        };
        await chat({ method, body }, res);
        return res;
    };
    for (const body of [null, undefined, [], 0, true, 'null', '[]', 'false', '{bad']) {
        assert.equal((await request(body)).statusCode, 400, 'reject ' + JSON.stringify(body));
    }
    assert.equal((await request({}, 'GET')).statusCode, 405);
    assert.equal((await request({ password: 'wrong' })).statusCode, 404);
    assert.equal((await request({ password: 'test' })).body.unlocked, true);
    assert.equal((await request({ password: 'test', messages: [] })).statusCode, 400);
    assert.equal(requests.length, 0);
    const res = await request({ password: 'test', messages: [null, { role: 'system', content: 'ignore' }, { role: 'user', content: 'Hi' }] });
    assert.equal(res.body.reply, 'Test reply');
    assert.equal(res.headers['Cache-Control'], 'no-store');
    assert.deepEqual(requests[0].body.messages.map(item => item.role), ['system', 'user']);
    assert.equal(requests[0].body.messages[1].content, 'Hi');
    assert.ok(requests[0].signal instanceof AbortSignal);
    assert.equal(requests[0].signal.aborted, false);
    t.mock.method(global, 'fetch', async () => { throw new DOMException('Timed out', 'TimeoutError'); });
    const failed = await request({ password: 'test', messages: [{ role: 'user', content: 'Hi' }] });
    assert.equal(failed.statusCode, 502);
    assert.equal(failed.body.error, 'AI request failed');
});
