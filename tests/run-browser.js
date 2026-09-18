const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'justafish-browser-'));
const session = 'fish-' + Date.now().toString(36);
const cli = args => execFileSync('npx', ['--yes', '--package', '@playwright/cli@0.1.20', 'playwright-cli', '--session', session, ...args], { cwd: directory, encoding: 'utf8' });
try {
    const opened = cli(['open', process.env.TEST_BASE_URL || 'http://localhost:8080/']);
    if (opened.includes('### Error')) throw new Error(opened);
    const output = cli(['run-code', '--filename', path.join(__dirname, 'browser-check.js')]);
    const match = output.match(/### Result\s*\n([^\n]+)/);
    if (!match || !JSON.parse(match[1]).passed) throw new Error(output);
    JSON.parse(match[1]).checks.forEach(check => console.log('✓ ' + check));
} catch (error) {
    console.error(error.stdout || error.stderr || error.message);
    process.exitCode = 1;
} finally {
    try { cli(['close']); } catch (error) { /* Browser may not have opened. */ }
    fs.rmSync(directory, { recursive: true, force: true });
}
