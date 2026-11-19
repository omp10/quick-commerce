/**
 * Removes FCM tokens that cannot receive pushes from the current Firebase project.
 *
 * After the move from versapack-a920f to quick-commerce-8b950, every token the
 * apps registered under the old project answers SENDER_ID_MISMATCH and will
 * never deliver again. Tokens are not tagged with their project, so each one is
 * asked of FCM directly (validate_only: nothing reaches any device).
 *
 *   node scripts/cleanup-fcm-tokens.js                      dry run: probe + report
 *   node scripts/cleanup-fcm-tokens.js --apply              delete dead tokens
 *   node scripts/cleanup-fcm-tokens.js --wipe-all           dry run: count every token
 *   node scripts/cleanup-fcm-tokens.js --wipe-all --apply   delete EVERY token (apps re-save on next launch/login)
 *
 * Probing needs the NEW service account configured; the script refuses to run
 * otherwise, since probing with the old one would mark all the new tokens dead.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { FoodUser } from '../src/core/users/user.model.js';
import { FoodRestaurant } from '../src/modules/food/restaurant/models/restaurant.model.js';
import { FoodDeliveryPartner } from '../src/modules/food/delivery/models/deliveryPartner.model.js';
import { FoodAdmin } from '../src/core/admin/admin.model.js';
import {
    reloadServiceAccountFromSettings,
    probeFirebaseDeviceToken,
    detachFirebaseDeviceTokenEverywhere,
    getActiveFirebaseProjectId,
} from '../src/core/notifications/firebase.service.js';

const APPLY = process.argv.includes('--apply');
const WIPE_ALL = process.argv.includes('--wipe-all');
const NEW_PROJECT = 'quick-commerce-8b950';
const MODELS = { USER: FoodUser, RESTAURANT: FoodRestaurant, DELIVERY_PARTNER: FoodDeliveryPartner, ADMIN: FoodAdmin };
const FIELDS = ['fcmTokens', 'fcmTokenMobile'];

const preview = (t) => `${String(t).slice(0, 12)}…`;

async function wipeAll() {
    for (const [name, model] of Object.entries(MODELS)) {
        const filter = { $or: FIELDS.map((f) => ({ [`${f}.0`]: { $exists: true } })) };
        const count = await model.countDocuments(filter);
        console.log(`${name}: ${count} owner(s) with tokens`);
        if (APPLY && count) {
            const r = await model.updateMany(filter, { $set: { fcmTokens: [], fcmTokenMobile: [] } });
            console.log(`  cleared ${r.modifiedCount}`);
        }
    }
}

async function probeAll() {
    await reloadServiceAccountFromSettings();
    const project = getActiveFirebaseProjectId();
    if (project !== NEW_PROJECT) {
        throw new Error(`Active Firebase project is "${project}", not ${NEW_PROJECT}. Configure the new service account first.`);
    }
    console.log(`probing against ${project}\n`);

    const tokens = new Set();
    for (const model of Object.values(MODELS)) {
        const docs = await model.find({}, FIELDS.join(' ')).lean();
        for (const d of docs) for (const f of FIELDS) for (const t of d[f] || []) if (t) tokens.add(String(t).trim());
    }

    let live = 0, dead = 0, unknown = 0;
    for (const token of tokens) {
        const r = await probeFirebaseDeviceToken(token);
        if (r.ok) { live += 1; continue; }
        if (!r.dead) { unknown += 1; console.log(`? ${preview(token)} ${r.error}`); continue; }
        dead += 1;
        console.log(`✗ ${preview(token)} ${r.error}`);
        if (APPLY) await detachFirebaseDeviceTokenEverywhere(token);
    }
    console.log(`\n${tokens.size} token(s): ${live} live, ${dead} dead${APPLY ? ' (deleted)' : ''}, ${unknown} unknown (kept)`);
}

async function main() {
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, { serverSelectionTimeoutMS: 30000 });
    console.log(`connected -> ${mongoose.connection.name}${APPLY ? '' : '  (dry run)'}`);
    await (WIPE_ALL ? wipeAll() : probeAll());
    if (!APPLY) console.log('\nDry run. Re-run with --apply to write.');
}

main()
    .catch((e) => { console.error(e.message); process.exitCode = 1; })
    .finally(() => mongoose.disconnect());
