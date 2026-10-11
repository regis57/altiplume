#!/usr/bin/env node
// Génère la paire de clés VAPID des notifications. À lancer UNE fois :
//   node scripts/vapid-keys.mjs
// puis coller les deux lignes dans le .env du NAS. La clé privée est un secret.
import { generateVapidKeys } from '../packages/server/src/push/webpush.ts';
const { publicKey, privateKey } = generateVapidKeys();
process.stdout.write(`VAPID_PUBLIC_KEY=${publicKey}\nVAPID_PRIVATE_KEY=${privateKey}\n`);
