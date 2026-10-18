/**
 * Le formulaire de contact : un message part vers la boîte de l'éditeur, et rien
 * n'est gardé.
 *
 * Trois principes :
 *  1. **Le destinataire vient de la configuration**, jamais du navigateur. Sans
 *     cela, le formulaire serait un relais à spam ouvert sur Internet.
 *  2. **Rien n'est stocké.** Le message traverse le serveur et s'en va. Le
 *     journal d'audit note qu'un message est parti, sans son contenu ni son
 *     auteur : il n'y a donc rien à voler, et rien à effacer plus tard.
 *  3. **L'anti-abus ne demande rien à personne** : pas de captcha, pas de tiers,
 *     pas de cookie. Un champ-piège que seuls les robots remplissent, un délai
 *     minimum de rédaction, une limite par adresse IP, et des longueurs bornées.
 *
 * Aucune donnée ne touche la base : pas de SQL, donc pas d'injection SQL. Le
 * texte reçu n'est jamais interprété — il part en clair dans un courriel, et sa
 * version HTML est échappée caractère par caractère.
 */
import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';
import { audit } from '../db/repos/audit.ts';
import { isValidEmail, normalizeEmail } from '../auth/validation.ts';

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 4000;
export const SUBJECT_MAX = 120;
/** Un humain met plus de trois secondes à écrire dix caractères et à viser le bouton. */
export const MIN_FILL_MS = 3_000;

const schema = {
  body: {
    type: 'object',
    required: ['message'],
    additionalProperties: false,
    properties: {
      message: { type: 'string', minLength: MESSAGE_MIN, maxLength: MESSAGE_MAX },
      email: { type: 'string', maxLength: 254 },
      subject: { type: 'string', maxLength: SUBJECT_MAX },
      // Champ-piège : invisible à l'écran et pour les lecteurs d'écran. Un robot le remplit.
      site: { type: 'string', maxLength: 200 },
      // Millisecondes écoulées depuis l'affichage du formulaire, mesurées par le navigateur.
      elapsed: { type: 'integer', minimum: 0, maximum: 86_400_000 },
    },
  },
} as const;

/** Les caractères de contrôle n'ont rien à faire dans un sujet ni dans une adresse. */
function singleLine(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
}

function escapeHtml(raw: string): string {
  return raw.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export function registerContactRoutes(app: FastifyInstance, ctx: AppContext): void {
  const to = ctx.config.mail.contact;

  /** Le formulaire existe-t-il ? Sans adresse configurée, la page le dit au lieu de mentir. */
  app.get('/v1/contact', async (_request, reply) => reply.send({ available: to !== null }));

  app.post('/v1/contact', {
    schema,
    config: { rateLimit: { max: 3, timeWindow: '1 hour' } },
  }, async (request, reply) => {
    if (to === null) return reply.code(503).send({ error: 'contact_unavailable' });
    const body = request.body as { message: string; email?: string; subject?: string; site?: string; elapsed?: number };

    // Les robots : on leur répond comme si tout allait bien, pour ne rien leur apprendre.
    const trapped = (body.site ?? '').length > 0;
    // Le vrai formulaire envoie toujours `elapsed` : sans lui, c'est un envoi direct à l'API.
    const tooFast = (body.elapsed ?? 0) < MIN_FILL_MS;
    if (trapped || tooFast) {
      audit(ctx.db, 'contact.rejected', null, { raison: trapped ? 'piege' : 'trop-rapide' }, ctx.now());
      return reply.code(202).send({ sent: true });
    }

    const message = body.message.trim();
    if (message.length < MESSAGE_MIN) return reply.code(400).send({ error: 'invalid', fields: ['message_too_short'] });

    const replyTo = body.email ? normalizeEmail(singleLine(body.email)) : '';
    if (replyTo && !isValidEmail(replyTo)) return reply.code(400).send({ error: 'invalid', fields: ['email_invalid'] });
    const subject = singleLine(body.subject ?? '').slice(0, SUBJECT_MAX) || 'Message depuis altiplume.com';

    const entete = replyTo ? `De : ${replyTo}` : 'Sans adresse de réponse.';
    try {
      await ctx.mailer.send({
        to,
        subject: `[Altiplume] ${subject}`,
        text: `${entete}\n\n${message}\n`,
        html: `<p>${escapeHtml(entete)}</p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        ...(replyTo ? { replyTo } : {}),
      });
    } catch {
      // On ne dit pas pourquoi : la personne n'y peut rien, et le détail n'aide que l'attaquant.
      return reply.code(502).send({ error: 'contact_failed' });
    }
    // Ni le contenu, ni l'adresse : seulement qu'un message est parti.
    audit(ctx.db, 'contact.sent', null, { avecAdresse: replyTo !== '' }, ctx.now());
    return reply.code(202).send({ sent: true });
  });
}
