import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";

// Explicit test-only URL: never run implicitly against the app database.
const url = process.env.BUTTON_MIGRATION_TEST_DATABASE_URL;
if (!url) throw new Error("Set BUTTON_MIGRATION_TEST_DATABASE_URL to a disposable PostgreSQL database");
const client = new pg.Client({ connectionString: url });
const schema = `button_test_${randomUUID().replaceAll("-", "")}`;
await client.connect();
try {
  await client.query(`CREATE SCHEMA "${schema}"`);
  await client.query(`SET search_path TO "${schema}"`);
  const migrations = (await readdir("prisma/migrations", { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  const feature = "20260914170000_opening_dm_buttons";
  assert.ok(migrations.includes(feature), "Opening button migration must exist");
  for (const migration of migrations.filter(name => name < feature)) {
    await client.query(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }
  await client.query(`
    INSERT INTO "User" (id, "updatedAt") VALUES ('owner', now());
    INSERT INTO "Workspace" (id, name, "ownerId", "updatedAt") VALUES ('workspace', 'Test', 'owner', now());
    INSERT INTO "InstagramAccount" (id, "workspaceId", "instagramId", username, "accessToken", "updatedAt")
      VALUES ('account', 'workspace', 'test-ig', 'test', 'not-a-token', now());
    INSERT INTO "Automation" (id, "workspaceId", "instagramAccountId", name, keywords, "dmMessage", "openingDmEnabled", "openingDmMessage", "openingDmButtonLabel", "updatedAt")
      VALUES ('legacy', 'workspace', 'account', 'Legacy', ARRAY['GUIDE'], 'Reveal', true, 'Welcome', 'Continue', now());
  `);
  await client.query(await readFile(`prisma/migrations/${feature}/migration.sql`, "utf8"));
  const { rows: [legacy] } = await client.query('SELECT "openingDmButtons", "openingDmButtonLabel", "dmMessage" FROM "Automation" WHERE id = $1', ['legacy']);
  assert.deepEqual(legacy, { openingDmButtons: [], openingDmButtonLabel: 'Continue', dmMessage: 'Reveal' });
  const buttons = [{ id: 'b1', label: 'Guide', targetCampaignId: null }, { id: 'b2', label: 'Workflow', targetCampaignId: 'target' }];
  await client.query('UPDATE "Automation" SET "openingDmButtons" = $1 WHERE id = $2', [JSON.stringify(buttons), 'legacy']);
  const { rows: [saved] } = await client.query('SELECT "openingDmButtons" FROM "Automation" WHERE id = $1', ['legacy']);
  assert.deepEqual(saved.openingDmButtons, buttons);
  await client.query(`
    INSERT INTO "TrackedLink" (id, "workspaceId", "automationId", slug, "destinationUrl", "createdAt", "updatedAt")
      VALUES ('link-a', 'workspace', 'legacy', 'primary', 'https://example.com/primary', now(), now()),
             ('link-b', 'workspace', 'legacy', 'secondary', 'https://example.com/secondary', now(), now());
    INSERT INTO "LinkClick" (id, "workspaceId", "automationId", "instagramAccountId", "trackedLinkId", "ipHash")
      VALUES ('legacy-click', 'workspace', 'legacy', 'account', 'link-a', 'legacy-ip');
  `);
  for (const migration of migrations.filter(name => name > feature)) {
    await client.query(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  }
  const { rows: links } = await client.query('SELECT id, position FROM "TrackedLink" ORDER BY position');
  assert.deepEqual(links, [{ id: 'link-a', position: 0 }, { id: 'link-b', position: 1 }]);
  const { rows: [click] } = await client.query('SELECT "ipHash", "recipientHash" FROM "LinkClick" WHERE id = $1', ['legacy-click']);
  assert.deepEqual(click, { ipHash: 'legacy-ip', recipientHash: null });
  const { rows: [upgraded] } = await client.query('SELECT "openingDmButtons" FROM "Automation" WHERE id = $1', ['legacy']);
  assert.deepEqual(upgraded.openingDmButtons, buttons);
  console.log('Migrations preserved legacy data, opening buttons, link order and clicks.');
} finally {
  await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  await client.end();
}
