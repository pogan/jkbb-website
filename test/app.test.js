const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Baza statystyk testów w katalogu tymczasowym, nie w data/.
process.env.STATS_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'jkbb-')), 'stats.sqlite');
delete process.env.STATS_PASSWORD;
const app = require('../jkbb-website-express-app');

let base, server;
test.before(async () => {
	server = await new Promise((resolve) => {
		const s = app.listen(0, '127.0.0.1', () => resolve(s));
	});
	base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => server.close());

test('strona główna z wersją i bieżącym rokiem w stopce', async () => {
	const res = await fetch(`${base}/`);
	assert.equal(res.status, 200);
	const html = await res.text();
	assert.match(html, /Jan Konop Big Band/);
	assert.ok(html.includes(app.locals.appVersion.label), 'wersja w stopce');
	assert.ok(html.includes(`© ${new Date().getFullYear()} Jan Konop Big Band`));
});

test('/healthz w formacie vamude-kit', async () => {
	const res = await fetch(`${base}/healthz`);
	assert.equal(res.status, 200);
	const body = await res.json();
	assert.equal(body.status, 'ok');
	assert.equal(body.app, 'jkbb-website');
	assert.deepEqual(body.checks, { stats: 'ok' });
});

test('pliki statyczne i stary adres /index.html', async () => {
	assert.equal((await fetch(`${base}/translations.json`)).status, 200);
	assert.equal((await fetch(`${base}/main.css`)).status, 200);
	const old = await fetch(`${base}/index.html`, { redirect: 'manual' });
	assert.equal(old.status, 301);
	assert.equal(old.headers.get('location'), '/');
});

test('panel statystyk wyłączony bez STATS_PASSWORD', async () => {
	assert.equal((await fetch(`${base}/stats`)).status, 404);
});
