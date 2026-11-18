const path = require('path');
const express = require('express');
const { readVersion, healthz, createStats, createAdmin } = require('vamude-kit');

// .env: PORT, HOST, STATS_DB, GOOGLE_CLIENT_ID, ADMIN_EMAILS (panel /kierownik).
try {
	process.loadEnvFile(path.join(__dirname, '.env'));
} catch {
	// brak pliku - zostają wartości domyślne
}

const app = express();
// Ruch przychodzi przez nginx (prod) albo Caddy (podgląd); req.ip = adres odwiedzającego.
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const version = readVersion({ root: __dirname });
app.locals.appVersion = version;

// Panel administratora /kierownik (logowanie Google, ADMIN_EMAILS) i statystyki
// odwiedzin pod /kierownik/stats (vamude-kit).
const stats = createStats({ file: process.env.STATS_DB || path.join(__dirname, 'data', 'stats.sqlite') });
const admin = createAdmin({ stats });
app.use(admin.middleware);
app.use(stats.middleware);
app.use(stats.panel);
app.use(admin.router);

app.get('/healthz', healthz({ version, checks: { stats: () => stats.db.prepare('SELECT 1').get() } }));

app.get('/', (req, res) => res.render('index'));
// Stary adres strony sprzed przejścia na szablon.
app.get('/index.html', (req, res) => res.redirect(301, '/'));

app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;

if (require.main === module) {
	const PORT = process.env.PORT || 3001;
	// Domyślnie tylko localhost (ruch z zewnątrz przez nginx); w kontenerze podglądu HOST=0.0.0.0.
	const HOST = process.env.HOST || '127.0.0.1';
	app.listen(PORT, HOST, () => {
		console.log(`jkbb-website ${version.label} nasłuchuje na http://${HOST}:${PORT}`);
	});
}
