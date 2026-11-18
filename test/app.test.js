const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Baza statystyk testów w katalogu tymczasowym, nie w data/.
process.env.STATS_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'jkbb-')), 'stats.sqlite');
process.env.ADMIN_EMAILS = 'admin@example.com';
process.env.GOOGLE_CLIENT_ID = 'test.apps.googleusercontent.com';
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

test('panel /kierownik: logowanie Google, statystyki tylko dla admina', async () => {
	const login = await fetch(`${base}/kierownik`);
	assert.equal(login.status, 200);
	assert.match(await login.text(), /data-client_id="test\.apps\.googleusercontent\.com"/);
	const stats = await fetch(`${base}/kierownik/stats`, { redirect: 'manual' });
	assert.equal(stats.status, 303);
	assert.equal(stats.headers.get('location'), '/kierownik?next=%2Fkierownik%2Fstats');
	assert.equal((await fetch(`${base}/kierownik/stats.json`)).status, 401);
	assert.equal((await fetch(`${base}/stats`)).status, 404);
});

test('podgląd: PREVIEW_LOGIN daje wejście do statystyk bez Google', async () => {
	process.env.PREVIEW_LOGIN = 'true';
	await fetch(`${base}/`, { headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'accept-language': 'pl' } });
	await new Promise((r) => setTimeout(r, 20));
	const res = await fetch(`${base}/kierownik/podglad`, { method: 'POST', redirect: 'manual' });
	assert.equal(res.status, 303);
	const cookie = res.headers.get('set-cookie').split(';')[0];
	const json = await fetch(`${base}/kierownik/stats.json`, { headers: { cookie } });
	assert.equal(json.status, 200);
	assert.ok((await json.json()).pages.some((p) => p.name === '/'));
	delete process.env.PREVIEW_LOGIN;
});
