import type { Database } from '../db/database.ts';
import { gameDayIndex, startOfGameDay } from '../sim/day.ts';

/**
 * Le budget de courrier du jour. Brevo, dans sa formule gratuite, envoie 300 courriels
 * par jour pour tout le jeu : liens de connexion, messages du formulaire de contact,
 * avertissements d'inactivité. Sans plafond, une seule source pouvait tout épuiser, et
 * plus personne ne recevait de lien jusqu'au lendemain (revue du 18/10).
 *
 * Deux plafonds, comptés sur le jour du jeu (minuit UTC, comme Brevo) :
 * - 250 liens par jour, tous motifs : les 50 qui restent vont au contact et aux
 *   avertissements ;
 * - dont 150 inscriptions au plus : il reste toujours 100 liens pour les joueurs
 *   déjà inscrits, même un jour où des robots s'inscrivent en masse.
 *
 * Le compte vient du journal d'audit (ce qui est parti ou a échoué aujourd'hui), plus
 * ce qui est en cours d'envoi : il survit à un redémarrage du serveur.
 */
export const LINKS_PER_DAY = 250;
export const SIGNUPS_PER_DAY = 150;

export type Purpose = 'signup' | 'login';

export interface MailBudget {
  /** Ce qui empêche un envoi de ce motif maintenant, ou null. */
  refusal(purpose: Purpose, now: number): 'mail_quota' | 'signups_full' | null;
  /** Compte un envoi qui part ; la fonction rendue le retire des envois en cours. */
  reserve(purpose: Purpose): () => void;
}

export function createMailBudget(db: Database): MailBudget {
  const pending = { signup: 0, login: 0 };
  const count = (now: number, purpose?: Purpose): number => {
    const since = startOfGameDay(gameDayIndex(now));
    const row = purpose
      ? db.prepare("SELECT COUNT(*) AS n FROM audit WHERE at >= ? AND event IN ('magic_link.sent', 'magic_link.failed') AND json_extract(meta, '$.purpose') = ?").get(since, purpose)
      : db.prepare("SELECT COUNT(*) AS n FROM audit WHERE at >= ? AND event IN ('magic_link.sent', 'magic_link.failed')").get(since);
    return (row as { n: number }).n;
  };
  return {
    refusal(purpose, now) {
      if (count(now) + pending.signup + pending.login >= LINKS_PER_DAY) return 'mail_quota';
      if (purpose === 'signup' && count(now, 'signup') + pending.signup >= SIGNUPS_PER_DAY) return 'signups_full';
      return null;
    },
    reserve(purpose) {
      pending[purpose] += 1;
      let done = false;
      return () => { if (!done) { done = true; pending[purpose] -= 1; } };
    },
  };
}

/**
 * Le bloc d'adresses d'un visiteur, pour la limite de débit. Un abonné IPv6 reçoit en
 * général tout un /64 : des milliards d'adresses, une par requête s'il le veut. La
 * limite compte donc par /64 en IPv6, par adresse en IPv4.
 */
export function addressBlock(ip: string): string {
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
  if (mapped) return mapped[1]!;
  if (!ip.includes(':')) return ip;
  const [head = '', tail = ''] = ip.split('::');
  const left = head ? head.split(':') : [];
  const right = ip.includes('::') && tail ? tail.split(':') : [];
  const groups = ip.includes('::')
    ? [...left, ...Array<string>(Math.max(0, 8 - left.length - right.length)).fill('0'), ...right]
    : left;
  return `${groups.slice(0, 4).map((g) => (Number.parseInt(g, 16) || 0).toString(16)).join(':')}::/64`;
}
