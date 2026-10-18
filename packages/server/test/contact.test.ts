import { describe, expect, it } from 'vitest';
import { testApp } from './helpers.ts';
import { MIN_FILL_MS } from '../src/routes/contact.ts';

const bon = { message: 'Bonjour, le jeu rame un peu sur mon vieux téléphone.', elapsed: MIN_FILL_MS + 1000 };

describe('le formulaire de contact', () => {
  it('envoie le message à la boîte de l\'éditeur, jamais à une adresse fournie par le navigateur', async () => {
    const t = await testApp();
    const r = await t.json('POST', '/v1/contact', { ...bon, email: 'Visiteur@Example.test', subject: 'Un bug' });
    expect(r.statusCode).toBe(202);
    const envoye = t.mailer.sent.at(-1)!;
    expect(envoye.to).toBe('bonjour@altiplume.com');
    expect(envoye.subject).toBe('[Altiplume] Un bug');
    expect(envoye.replyTo).toBe('visiteur@example.test');
    expect(envoye.text).toContain('le jeu rame un peu');
    // Rien n'est gardé : le journal note l'envoi, sans contenu ni adresse.
    const trace = t.ctx.db.prepare("SELECT event, meta FROM audit WHERE event = 'contact.sent'").get() as { event: string; meta: string };
    expect(trace.meta).toBe('{"avecAdresse":true}');
    expect(trace.meta).not.toContain('example.test');
    await t.app.close();
  });

  it('accepte un message sans adresse de réponse', async () => {
    const t = await testApp();
    expect((await t.json('POST', '/v1/contact', bon)).statusCode).toBe(202);
    expect(t.mailer.sent.at(-1)!.replyTo).toBeUndefined();
    await t.app.close();
  });

  it('refuse une adresse invalide et un message trop court', async () => {
    const t = await testApp();
    expect((await t.json('POST', '/v1/contact', { ...bon, email: 'pas-une-adresse' })).json().fields).toEqual(['email_invalid']);
    expect((await t.json('POST', '/v1/contact', { ...bon, message: 'court' })).statusCode).toBe(400);
    expect((await t.json('POST', '/v1/contact', { ...bon, message: '          ' })).statusCode).toBe(400);
    expect(t.mailer.sent).toHaveLength(0);
    await t.app.close();
  });

  it('limite à trois messages par heure et par adresse IP', async () => {
    const t = await testApp();
    for (let i = 0; i < 3; i += 1) expect((await t.json('POST', '/v1/contact', bon)).statusCode).toBe(202);
    const quatrieme = await t.json('POST', '/v1/contact', bon);
    expect(quatrieme.statusCode).toBe(429);
    expect(t.mailer.sent).toHaveLength(3);
    await t.app.close();
  });

  it('avale les robots sans rien leur apprendre : champ-piège et remplissage trop rapide', async () => {
    const t = await testApp();
    const avant = t.mailer.sent.length;
    const piege = await t.json('POST', '/v1/contact', { ...bon, site: 'https://spam.example' });
    const vite = await t.json('POST', '/v1/contact', { ...bon, elapsed: 200 });
    // Même réponse que pour un humain : le robot ne peut pas distinguer.
    expect(piege.statusCode).toBe(202);
    expect(vite.statusCode).toBe(202);
    expect(t.mailer.sent.length).toBe(avant);
    const rejets = t.ctx.db.prepare("SELECT COUNT(*) AS n FROM audit WHERE event = 'contact.rejected'").get() as { n: number };
    expect(Number(rejets.n)).toBe(2);
    await t.app.close();
  });

  it('avale aussi un envoi direct à l\'API, sans le délai de rédaction', async () => {
    const t = await testApp();
    const r = await t.json('POST', '/v1/contact', { message: bon.message });
    expect(r.statusCode).toBe(202);
    expect(r.json()).toEqual({ sent: true });
    expect(t.mailer.sent).toHaveLength(0);
    await t.app.close();
  });

  it('nettoie le sujet et l\'adresse : pas d\'injection d\'en-tête par retour à la ligne', async () => {
    const t = await testApp();
    const r = await t.json('POST', '/v1/contact', {
      ...bon,
      subject: 'Coucou\nBcc: victime@example.test',
      email: ' Visiteur@example.test ',
    });
    expect(r.statusCode).toBe(202);
    const envoye = t.mailer.sent.at(-1)!;
    expect(envoye.subject).not.toContain('\n');
    expect(envoye.subject).toBe('[Altiplume] Coucou Bcc: victime@example.test');
    expect(envoye.replyTo).toBe('visiteur@example.test');
    await t.app.close();
  });

  it('échappe le message dans la version HTML du courriel', async () => {
    const t = await testApp();
    await t.json('POST', '/v1/contact', { ...bon, message: 'Regardez <script>alert(1)</script> et "ça" & ça.' });
    const envoye = t.mailer.sent.at(-1)!;
    expect(envoye.html).toContain('&lt;script&gt;');
    expect(envoye.html).not.toContain('<script>');
    expect(envoye.text).toContain('<script>'); // le texte brut n'est jamais interprété
    await t.app.close();
  });

  it('refuse les champs inconnus et les messages démesurés', async () => {
    const t = await testApp();
    expect((await t.json('POST', '/v1/contact', { ...bon, to: 'victime@example.test' })).statusCode).toBe(400);
    expect((await t.json('POST', '/v1/contact', { ...bon, message: 'x'.repeat(4001) })).statusCode).toBe(400);
    await t.app.close();
  });

  it('se déclare indisponible quand aucune adresse n\'est configurée, et n\'envoie rien', async () => {
    const t = await testApp(undefined, { MAIL_CONTACT: '' });
    expect((await t.json('GET', '/v1/contact')).json()).toEqual({ available: false });
    const r = await t.json('POST', '/v1/contact', bon);
    expect(r.statusCode).toBe(503);
    expect(r.json().error).toBe('contact_unavailable');
    expect(t.mailer.sent).toHaveLength(0);
    await t.app.close();
  });

  it('annonce le formulaire disponible quand une adresse est configurée', async () => {
    const t = await testApp();
    expect((await t.json('GET', '/v1/contact')).json()).toEqual({ available: true });
    await t.app.close();
  });
});
