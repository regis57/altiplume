/**
 * La suppression après 24 mois sans connexion — promise par la politique de
 * confidentialité, donc tenue.
 *
 * Deux avertissements par email, à 22 et 23 mois, puis l'effacement à 24 mois :
 * le joueur, ses sessions, ses passkeys, sa compagnie, tout suit par cascade.
 * Se reconnecter à n'importe quel moment remet le compteur à zéro. Le balayage
 * tourne avec le ménage horaire ; chaque passage traite au plus quelques
 * dizaines de comptes, pour ne jamais noyer le relais de courrier.
 */
import type { AppContext } from '../context.ts';
import { audit } from '../db/repos/audit.ts';
import { deletePlayer } from '../db/repos/players.ts';
import type { Message } from '../mail/mailer.ts';
import type { Locale } from '../auth/validation.ts';
import { isLocale } from '../auth/validation.ts';

/**
 * Des mois du calendrier, pas des tranches de trente jours : « 24 mois » valaient 720
 * jours, et un compte partait onze jours avant la date promise (revue du 18/10).
 * Le 31 janvier plus un mois donne le dernier jour de février.
 */
export function afterMonths(ms: number, months: number): number {
  const d = new Date(ms);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.getTime();
}
export const FIRST_WARNING_MONTHS = 22;
export const SECOND_WARNING_MONTHS = 23;
export const EXPIRY_MONTHS = 24;
const BATCH = 50;
/** Une marge pour la présélection en base : le calcul exact se fait ensuite, ligne par ligne. */
const SLACK_MS = 4 * 86_400_000;

interface Row { id: string; email: string; nickname: string; locale: string; last_seen_at: number; inactivity_warned: number }

function warningMessage(row: Row, origin: string, deleteAt: number, second: boolean): Message {
  const locale: Locale = isLocale(row.locale) ? row.locale : 'fr';
  const date = new Date(deleteAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const link = `${origin}/connexion`;
  const c = locale === 'fr'
    ? {
      subject: second ? 'Altiplume — dernier rappel avant la fermeture de votre aérodrome' : 'Altiplume — votre aérodrome attend',
      intro: `Bonjour ${row.nickname},`,
      body: second
        ? `Il y a bientôt deux ans que vous n'êtes pas passé à l'aérodrome. Sans connexion avant le ${date}, votre compte et tout ce qu'il contient — compagnie, pilotes, album — seront supprimés définitivement, comme promis dans notre politique de confidentialité.`
        : `Il y a vingt-deux mois que vous n'êtes pas passé à l'aérodrome. Rien n'est perdu : le courrier attend, les pilotes se reposent. Mais si vous ne vous connectez pas avant le ${date}, votre compte et ses données seront supprimés, comme promis dans notre politique de confidentialité.`,
      action: 'Pour garder votre aérodrome, il suffit de vous connecter une fois :',
      ignore: "Si vous préférez que tout soit effacé, ne faites rien : ce sera fait à la date indiquée, et nous ne vous écrirons plus.",
      sign: "L'aérodrome de la Croisette",
    }
    : {
      subject: second ? 'Altiplume — last reminder before your aerodrome closes' : 'Altiplume — your aerodrome is waiting',
      intro: `Hello ${row.nickname},`,
      body: second
        ? `It has been almost two years since you last visited the aerodrome. Without a sign-in before ${date}, your account and everything in it — company, pilots, album — will be permanently deleted, as promised in our privacy policy.`
        : `It has been twenty-two months since you last visited the aerodrome. Nothing is lost: the mail is waiting, the pilots are resting. But if you don't sign in before ${date}, your account and its data will be deleted, as promised in our privacy policy.`,
      action: 'To keep your aerodrome, just sign in once:',
      ignore: "If you'd rather everything was erased, do nothing: it will be done on that date, and we won't write again.",
      sign: 'Crosslet Field',
    };
  const esc = (t: string) => t.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string);
  return {
    to: row.email,
    subject: c.subject,
    text: `${c.intro}\n\n${c.body}\n\n${c.action}\n${link}\n\n${c.ignore}\n\n— ${c.sign}`,
    html: `<!doctype html><html lang="${locale}"><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#2b2420;max-width:36em">
<p>${esc(c.intro)}</p><p>${esc(c.body)}</p><p>${esc(c.action)}</p>
<p><a href="${esc(link)}" style="display:inline-block;padding:.6em 1.2em;background:#b4552d;color:#fff;text-decoration:none;border-radius:4px">${locale === 'fr' ? 'Me connecter' : 'Sign me in'}</a></p>
<p>${esc(c.ignore)}</p><p style="color:#6b5f58">— ${esc(c.sign)}</p></body></html>`,
  };
}

/** Un passage : avertit, puis efface. Rend ce qui a été fait, pour les tests et le journal. */
export async function sweepInactive(ctx: AppContext, now: number): Promise<{ warned: number; expired: number }> {
  const db = ctx.db;
  let warned = 0; let expired = 0;

  // 3. L'effacement : 24 mois, et les deux avertissements envoyés.
  const gone = (db.prepare('SELECT id, last_seen_at FROM players WHERE last_seen_at <= ? AND inactivity_warned >= 2 LIMIT ?')
    .all(afterMonths(now, -EXPIRY_MONTHS) + SLACK_MS, BATCH) as { id: string; last_seen_at: number }[])
    .filter((p) => now > afterMonths(p.last_seen_at, EXPIRY_MONTHS));
  for (const p of gone) {
    if (deletePlayer(db, p.id)) { expired += 1; audit(db, 'player.expired', null, {}, now); }
  }

  // 2. et 1. Les avertissements, le second d'abord pour ne pas envoyer les deux le même jour.
  const current = db.prepare('SELECT last_seen_at, inactivity_warned FROM players WHERE id = ?');
  for (const [stage, months] of [[2, SECOND_WARNING_MONTHS], [1, FIRST_WARNING_MONTHS]] as const) {
    const rows = (db.prepare('SELECT id, email, nickname, locale, last_seen_at, inactivity_warned FROM players WHERE last_seen_at <= ? AND inactivity_warned = ? LIMIT ?')
      .all(afterMonths(now, -months) + SLACK_MS, stage - 1, BATCH) as unknown as Row[])
      .filter((row) => now > afterMonths(row.last_seen_at, months));
    for (const row of rows) {
      // Le joueur a pu revenir pendant l'envoi des courriels précédents : on relit.
      const fresh = current.get(row.id) as { last_seen_at: number; inactivity_warned: number } | undefined;
      if (!fresh || fresh.last_seen_at !== row.last_seen_at || fresh.inactivity_warned !== stage - 1) continue;
      try {
        await ctx.mailer.send(warningMessage(row, ctx.config.publicOrigin, afterMonths(row.last_seen_at, EXPIRY_MONTHS), stage === 2));
      } catch {
        continue; // on réessaiera au prochain passage ; rien n'est marqué tant que rien n'est parti
      }
      // Seulement si rien n'a bougé pendant l'envoi : une connexion entre-temps a remis
      // le compteur à zéro, et l'écrire à 2 aurait mené à un effacement sans avertissement.
      const changes = Number(db.prepare('UPDATE players SET inactivity_warned = ? WHERE id = ? AND inactivity_warned = ? AND last_seen_at = ?')
        .run(stage, row.id, stage - 1, row.last_seen_at).changes);
      if (changes === 0) continue;
      audit(db, 'player.inactivity_warned', null, { stage }, now);
      warned += 1;
    }
  }
  return { warned, expired };
}
