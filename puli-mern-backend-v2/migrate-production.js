/**
 * migrate-production.js
 *
 * Production migration script.
 * Copies Categories, SubCategories, and Countries from the
 * Sayo production database into the Puli production database.
 *
 * Usage:
 *   set "SOURCE_URI=mongodb+srv://user:pass@cluster/sayomenu"
 *   set "TARGET_URI=mongodb+srv://user:pass@cluster/pulimenu"
 *   node migrate-production.js
 *
 * Or edit the default values below.
 */

const mongoose = require('mongoose');

// ═══════════════════════════════════════════════════════════
// EDIT THESE for your production database URIs
// ═══════════════════════════════════════════════════════════
const SOURCE_URI = process.env.SOURCE_URI || 'mongodb://127.0.0.1:27017/sayomenu';
const TARGET_URI = process.env.TARGET_URI || 'mongodb://127.0.0.1:27017/pulimenu';
// ═══════════════════════════════════════════════════════════

const COLLECTIONS = [
  { name: 'categories', label: 'Categories' },
  { name: 'subcategories', label: 'Sub-Categories' },
  { name: 'countries', label: 'Countries' },
];

async function migrate() {
  console.log('Connecting to source database...');
  const sourceConn = await mongoose.createConnection(SOURCE_URI).asPromise();

  console.log('Connecting to target database...');
  const targetConn = await mongoose.createConnection(TARGET_URI).asPromise();

  console.log('\n✓ Connected');
  console.log('  Source:', SOURCE_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  console.log('  Target:', TARGET_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

  for (const { name, label } of COLLECTIONS) {
    console.log(`\n── ${label} ──`);

    const docs = await sourceConn.db.collection(name).find({}).toArray();
    console.log(`  Source: ${docs.length} document(s)`);

    if (docs.length === 0) {
      console.log('  → Nothing to migrate');
      continue;
    }

    const existing = await targetConn.db.collection(name).countDocuments({});
    console.log(`  Target: ${existing} existing document(s)`);

    if (existing > 0) {
      console.log('  → Target already has data – skipping (delete target collection first to re-migrate)');
      continue;
    }

    const result = await targetConn.db.collection(name).insertMany(docs);
    console.log(`  → Inserted ${Object.keys(result.insertedIds).length} document(s)`);
  }

  await sourceConn.close();
  await targetConn.close();
  console.log('\n✓ Migration complete.');
}

migrate().catch((err) => {
  console.error('\n✗ Migration failed:', err.message);
  process.exit(1);
});
