/**
 * Fonder la compagnie : ce que le formulaire dit d'un refus du serveur.
 *
 * Avant la revue du 18 octobre, tout refus disait « Ce nom ne convient pas » : la
 * compagnie déjà fondée dans un autre onglet (409), dix essais en un quart d'heure
 * (429), une panne. Le joueur essayait d'autres noms, en vain.
 */
export type FoundingRefusal =
  /** La compagnie existe déjà : on l'affiche, au lieu de redemander un nom. */
  | { readonly kind: 'exists' }
  /** Le nom lui-même : le message va sous le champ. */
  | { readonly kind: 'field'; readonly key: string }
  /** Le reste : le message va en haut, avec les autres. */
  | { readonly kind: 'message'; readonly key: string };

/** `r` : la réponse du serveur, ou `null` s'il n'a pas pu être joint. */
export function foundingRefusal(r: { readonly status: number; readonly body: Readonly<Record<string, unknown>> } | null): FoundingRefusal {
  if (r === null) return { kind: 'message', key: 'error.network' };
  if (r.status === 409) return { kind: 'exists' };
  if (r.status === 429) return { kind: 'message', key: 'error.too_many_requests' };
  if (r.status === 400) return { kind: 'field', key: 'error.company_name_invalid' };
  const code = r.body['error'];
  return { kind: 'message', key: `error.${typeof code === 'string' && code !== 'invalid' ? code : 'server_error'}` };
}
