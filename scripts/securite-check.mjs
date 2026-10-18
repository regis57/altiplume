#!/usr/bin/env node
/**
 * Le contrôle de sécurité externe, automatisé : ce que les plateformes gratuites
 * voient d'altiplume.com, comparé à ce que la conception attend.
 *
 *   node scripts/securite-check.mjs [hôte] [--strict]
 *
 * Sans accès à l'intérieur du NAS, ni secret : tout se lit depuis Internet.
 *  - MDN HTTP Observatory (API publique) : note et tests échoués.
 *  - Qualys SSL Labs (API publique, résultat en cache ≤ 24 h) : note TLS.
 *  - DNS (Google DNS sur HTTPS) : SPF, DKIM Brevo, DMARC, CAA, adresses.
 *  - Le site lui-même : les en-têtes attendus, la redirection HTTP → HTTPS, et la
 *    version réellement déployée (/v1/version).
 *
 * `--strict` rend un code de sortie 1 si un résultat est sous l'attendu — c'est
 * le mode du workflow hebdomadaire. securityheaders.com n'a pas d'API : il se
 * vérifie à la main (il suit Observatory de près).
 */
const host = process.argv.find((a) => !a.startsWith('-') && !a.includes('/') && a.includes('.')) ?? 'altiplume.com';
const strict = process.argv.includes('--strict');
const rows = [];
function row(domaine, attendu, reel, ok, action = '') { rows.push({ domaine, attendu, reel, ok, action }); }

/** Une adresse IPv4 ou IPv6 tombe-t-elle dans une plage CIDR ? */
function inCidr(ip, cidr) {
  const [base, bits] = cidr.split('/');
  const v6 = ip.includes(':');
  if (v6 !== base.includes(':')) return false;
  const width = v6 ? 128 : 32;
  const n = Number(bits ?? width);
  const value = v6 ? ipv6(ip) : ipv4(ip);
  const start = v6 ? ipv6(base) : ipv4(base);
  if (value === null || start === null || !(n >= 0 && n <= width)) return false;
  const shift = BigInt(width - n);
  return (value >> shift) === (start >> shift);
}
function ipv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((x) => !Number.isInteger(x) || x < 0 || x > 255)) return null;
  return p.reduce((acc, x) => (acc << 8n) + BigInt(x), 0n);
}
function ipv6(ip) {
  const [head, tail] = ip.split('::');
  const part = (s) => (s ? s.split(':') : []);
  const h = part(head);
  const t = tail === undefined ? [] : part(tail);
  const groups = tail === undefined ? h : [...h, ...Array(8 - h.length - t.length).fill('0'), ...t];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/i.test(g))) return null;
  return groups.reduce((acc, g) => (acc << 16n) + BigInt(parseInt(g, 16)), 0n);
}

async function json(url, init) {
  const r = await fetch(url, { ...init, headers: { accept: 'application/json', 'user-agent': 'altiplume-securite-check', ...(init?.headers ?? {}) } });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}
const dns = async (name, type) => (await json(`https://dns.google/resolve?name=${name}&type=${type}`)).Answer ?? [];
const txt = (answers) => answers.map((a) => String(a.data).replace(/^"|"$/g, '').replace(/" "/g, ''));

// ---- Observatory ----
try {
  await json(`https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${host}`, { method: 'POST' }).catch(() => null);
  const a = await json(`https://observatory-api.mdn.mozilla.net/api/v2/analyze?host=${host}`);
  const failed = Object.values(a.tests ?? {}).filter((t) => t.pass === false).map((t) => `${t.name} (${t.score_modifier})`);
  const ok = ['A+', 'A'].includes(a.scan.grade);
  row('En-têtes HTTP (Observatory)', 'A ou A+', `${a.scan.grade} (${a.scan.score})${failed.length ? ' — échecs : ' + failed.join(', ') : ''}`, ok,
    failed.some((f) => f.startsWith('redirection')) ? 'Cloudflare → SSL/TLS → Edge Certificates → « Always Use HTTPS » : activé' : '');
} catch (e) { row('En-têtes HTTP (Observatory)', 'A ou A+', `indisponible (${e.message})`, null); }

// ---- SSL Labs ----
try {
  const s = await json(`https://api.ssllabs.com/api/v3/analyze?host=${host}&fromCache=on&maxAge=24`);
  if (s.status === 'READY') {
    const grades = (s.endpoints ?? []).map((e) => e.grade).filter(Boolean);
    const worst = grades.sort()[grades.length - 1] ?? '?';
    const protos = new Set((s.endpoints ?? []).flatMap((e) => (e.details?.protocols ?? []).map((p) => `${p.name} ${p.version}`)));
    const old = [...protos].filter((p) => /1\.0|1\.1/.test(p));
    row('TLS (SSL Labs)', 'A ou A+', `${worst}${old.length ? ' — accepte encore ' + old.join(', ') : ''}`, ['A+', 'A'].includes(worst),
      old.length ? 'Cloudflare → SSL/TLS → Edge Certificates → « Minimum TLS Version » : 1.2' : '');
  } else {
    row('TLS (SSL Labs)', 'A ou A+', `analyse ${s.status.toLowerCase()} — relancer dans quelques minutes`, null);
  }
} catch (e) { row('TLS (SSL Labs)', 'A ou A+', `indisponible (${e.message})`, null); }

// ---- DNS : courrier et certificats ----
try {
  const spfs = txt(await dns(host, 'TXT')).filter((t) => t.startsWith('v=spf1'));
  const spf = spfs[0];
  // Deux enregistrements SPF sur le même nom = SPF invalide : les liens de connexion tombent.
  const unique = spfs.length === 1;
  const brevo = Boolean(spf?.includes('include:spf.brevo.com'));
  const routing = Boolean(spf?.includes('include:_spf.mx.cloudflare.net'));
  row('Email — SPF', 'un seul enregistrement, Brevo + Cloudflare, en -all',
    spfs.length === 0 ? 'absent' : spfs.length > 1 ? `${spfs.length} enregistrements SPF (invalide)` : spf,
    unique && brevo && routing && /-all$/.test(spf),
    !unique && spfs.length > 1 ? 'Fusionner en un seul TXT : deux SPF sur le même nom sont invalides'
      : spfs.length === 0 ? `Cloudflare DNS → TXT ${host} : v=spf1 include:spf.brevo.com include:_spf.mx.cloudflare.net -all` : '');
  const dkim = await Promise.all(['brevo1', 'brevo2'].map(async (s) => (await dns(`${s}._domainkey.${host}`, 'CNAME')).length > 0));
  row('Email — DKIM (Brevo)', 'brevo1 et brevo2 publiés', dkim.every(Boolean) ? 'publiés' : 'incomplet', dkim.every(Boolean), dkim.every(Boolean) ? '' : 'Brevo → Expéditeurs et domaines → authentifier le domaine');
  const dmarc = txt(await dns(`_dmarc.${host}`, 'TXT')).find((t) => t.startsWith('v=DMARC1'));
  const policy = dmarc?.match(/p=(\w+)/)?.[1];
  row('Email — DMARC', 'p=quarantine ou p=reject', dmarc ?? 'absent', policy === 'quarantine' || policy === 'reject',
    policy === 'none' ? `Cloudflare DNS → TXT _dmarc.${host} : passer p=none en p=quarantine, puis p=reject après une semaine sans rejet légitime` : '');
  const caa = await dns(host, 'CAA');
  row('Certificats — CAA', 'les autorités de Cloudflare seulement', caa.length ? caa.map((c) => String(c.data)).join(' ; ') : 'absent (toute autorité peut émettre)', caa.length > 0,
    caa.length ? '' : `Cloudflare DNS → CAA ${host} : issue letsencrypt.org, pki.goog, digicert.com, comodoca.com, ssl.com (les autorités de l'Universal SSL)`);
  // Depuis le 11/10, le domaine reçoit du courrier par Cloudflare Email Routing :
  // des MX sont attendus, mais seulement ceux de Cloudflare. Un autre serveur de
  // courrier sur ce domaine serait une surprise, donc une alerte.
  const mx = (await dns(host, 'MX')).map((x) => String(x.data).split(' ').pop().replace(/\.$/, ''));
  const etrangers = mx.filter((name) => !/(^|\.)mx\.cloudflare\.net$/.test(name));
  row('Courrier entrant — MX', 'uniquement les MX de Cloudflare Email Routing', mx.length ? mx.join(', ') : 'aucun MX',
    mx.length > 0 && etrangers.length === 0,
    etrangers.length ? `Serveur de courrier inattendu : ${etrangers.join(', ')} — vérifier la zone DNS` : '');
} catch (e) { row('DNS', '—', `indisponible (${e.message})`, null); }

// ---- Surface réseau : chaque adresse du domaine, IPv4 et IPv6, chez Cloudflare ----
// Les adresses ne sont jamais recopiées dans le rapport : il est publié dans le
// résumé du workflow, et une adresse hors Cloudflare serait celle de la maison.
try {
  const adresses = [...(await dns(host, 'A')), ...(await dns(host, 'AAAA'))].filter((x) => x.type === 1 || x.type === 28).map((x) => String(x.data));
  const plages = async (url) => (await (await fetch(url, { headers: { 'user-agent': 'altiplume-securite-check' } })).text()).split(/\s+/).filter(Boolean);
  const cloudflare = [...(await plages('https://www.cloudflare.com/ips-v4')), ...(await plages('https://www.cloudflare.com/ips-v6'))];
  if (cloudflare.length < 10) throw new Error('liste des plages Cloudflare illisible');
  const dehors = adresses.filter((ip) => !cloudflare.some((plage) => inCidr(ip, plage)));
  row('Surface réseau', 'seulement des adresses Cloudflare (IPv4 et IPv6)',
    adresses.length === 0 ? 'aucune adresse' : dehors.length === 0 ? `${adresses.length} adresse(s), toutes chez Cloudflare` : `${dehors.length} adresse(s) sur ${adresses.length} hors Cloudflare (non recopiées ici)`,
    adresses.length > 0 && dehors.length === 0,
    dehors.length ? 'Cloudflare → DNS → Records : chaque enregistrement A et AAAA doit avoir le nuage orange (Proxied)' : '');
} catch (e) { row('Surface réseau', 'seulement des adresses Cloudflare (IPv4 et IPv6)', `indisponible (${e.message})`, null); }

// ---- Le site : en-têtes et redirection ----
try {
  const r = await fetch(`https://${host}/`, { headers: { 'user-agent': 'altiplume-securite-check' } });
  const h = r.headers;
  const expected = {
    'content-security-policy': (v) => v?.includes("default-src 'none'") && v.includes("require-trusted-types-for 'script'"),
    'strict-transport-security': (v) => /max-age=31536000/.test(v ?? ''),
    'x-content-type-options': (v) => v === 'nosniff',
    'referrer-policy': (v) => v === 'strict-origin-when-cross-origin',
    'permissions-policy': (v) => Boolean(v),
    'cross-origin-opener-policy': (v) => v === 'same-origin',
    'cross-origin-embedder-policy': (v) => v === 'require-corp',
    'cross-origin-resource-policy': (v) => v === 'same-origin',
  };
  const missing = Object.entries(expected).filter(([k, test]) => !test(h.get(k))).map(([k]) => k);
  row('En-têtes servis', 'tous ceux de security.ts', missing.length ? `manquants ou différents : ${missing.join(', ')}` : 'tous présents', missing.length === 0,
    missing.length ? 'Redéployer la dernière version (tâche NAS « redéployer »)' : '');
  const cookies = h.get('set-cookie');
  row('Cookies à l\'accueil', 'aucun', cookies ? 'un cookie posé avant connexion' : 'aucun', !cookies, '');
  const clear = await fetch(`http://${host}/`, { redirect: 'manual', headers: { 'user-agent': 'altiplume-securite-check' } });
  const loc = clear.headers.get('location') ?? '';
  const redirected = [301, 302, 307, 308].includes(clear.status) && loc.startsWith(`https://${host}`);
  row('HTTP → HTTPS', '301 vers https', redirected ? `${clear.status} → ${loc}` : `${clear.status} sans redirection`, redirected,
    redirected ? '' : 'Cloudflare → SSL/TLS → Edge Certificates → « Always Use HTTPS » : activé (le serveur redirige aussi depuis la v0.2)');
} catch (e) { row('Le site', '—', `indisponible (${e.message})`, null); }

// ---- Ce qui tourne vraiment ----
// Une image publiée dit son numéro et son commit. Si le NAS répond « dev », c'est
// qu'il ne tourne pas une image de la chaîne de publication — ou qu'un redéploiement
// a échoué sans le dire. C'est arrivé le 12/10, à dix minutes près.
try {
  const v = await json(`https://${host}/v1/version`);
  const connue = typeof v.version === 'string' && v.version !== 'dev' && typeof v.revision === 'string' && v.revision !== 'dev';
  row('Version déployée', 'une version publiée (pas « dev »)',
    `v${v.version} · ${v.revision}${v.builtAt ? ' · ' + String(v.builtAt).slice(0, 10) : ''} · ${v.stage}`, connue,
    connue ? '' : 'Rejouer la tâche de redéploiement du NAS : le conteneur ne tourne pas une image publiée');
} catch (e) { row('Version déployée', 'une version publiée (pas « dev »)', `indisponible (${e.message})`, null); }

// ---- Rapport ----
const mark = (ok) => (ok === null ? '·' : ok ? '✓' : '✗');
process.stdout.write(`== Contrôle de sécurité externe — ${host} — ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC\n\n`);
process.stdout.write('| | Domaine | Attendu | Réel | À faire |\n|---|---|---|---|---|\n');
for (const r of rows) process.stdout.write(`| ${mark(r.ok)} | ${r.domaine} | ${r.attendu} | ${r.reel} | ${r.action} |\n`);
const bad = rows.filter((r) => r.ok === false);
const muets = rows.filter((r) => r.ok === null);
// Un contrôle qui n'a rien pu mesurer n'est pas un contrôle réussi : sans cela,
// une panne de réseau ferait passer le workflow au vert sans rien vérifier.
const mesures = rows.filter((r) => r.ok !== null).length;
process.stdout.write(`\n${bad.length === 0 ? 'Tout est au niveau attendu.' : `${bad.length} point(s) sous l'attendu.`}`);
if (muets.length > 0) process.stdout.write(` ${muets.length} point(s) n'ont pas pu être mesurés.`);
process.stdout.write('\n');
if (strict && (bad.length > 0 || mesures === 0)) process.exit(1);
