const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildLocationFile, loadLocations, parseLocationFile } = require('../scripts/locations');
const { updateReadme, START_MARKER, END_MARKER } = require('../scripts/generate-readme');
const { validateLocationsDir, validateReadmeInSync } = require('../scripts/validate');

const repoRoot = path.join(__dirname, '..');
const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/issue-to-pr.yml'), 'utf8');
// Exercise the actual github-script body without GitHub writes or git commands.
const script = workflow.split('          script: |')[1].replace(/^ {12}/gm, '');
const noBoard = {
  name: 'No Board Cafe', address: '2 Example St, Norfolk, VA 23510',
  city: 'Norfolk', area: 'ghent', category: 'coffee-shop',
  status: 'no-board', verified_date: '2026-08-25',
  notes: 'Fictional fixture: an in-person visit confirmed no board.'
};

function setup(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'community-board-intake-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.cpSync(path.join(repoRoot, 'scripts'), path.join(dir, 'scripts'), { recursive: true });
  const locationDir = path.join(dir, 'data/locations/norfolk');
  fs.mkdirSync(locationDir, { recursive: true });
  const existingPath = path.join(locationDir, 'no-board-cafe.md');
  fs.writeFileSync(existingPath, buildLocationFile(noBoard));
  fs.writeFileSync(path.join(dir, 'README.md'), updateReadme(`${START_MARKER}\n${END_MARKER}\n`, [noBoard]));
  return { dir, existingPath, locationDir };
}

function runIntake(dir, name, claimedStatus) {
  const body = [
    ['City', 'Norfolk'], ['Location Name', name],
    ['Address', name === noBoard.name ? noBoard.address : '3 Example St, Norfolk, VA 23510'],
    ['Google Maps Link', 'https://maps.google.com/example'],
    ['Area', 'ghent'], ['Category', 'coffee-shop'], ['Notes', 'Submitted notes.'],
    ['Status', claimedStatus], ['Verified Date', '2026-08-25']
  ].map(([label, value]) => `### ${label}\n\n${value}`).join('\n\n');
  const context = { payload: { issue: { body, number: 999 } }, repo: { owner: 'example', repo: 'fixture' } };
  const harness = `
    const fs = require('node:fs');
    const calls = { comments: [], commands: [], prs: [] };
    const github = { rest: {
      issues: { createComment: async args => { calls.comments.push(args.body); } },
      pulls: {
        list: async () => ({ data: [] }),
        create: async args => { calls.prs.push(args); return { data: { number: 123 } }; }
      }
    } };
    const exec = { exec: async (...args) => { calls.commands.push(args); } };
    const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
    const run = new AsyncFunction('require', 'context', 'github', 'exec', ${JSON.stringify(script)});
    run(require, ${JSON.stringify(context)}, github, exec)
      .then(() => fs.writeFileSync('calls.json', JSON.stringify(calls)))
      .catch(error => { console.error(error); process.exitCode = 1; });
  `;
  const result = spawnSync(process.execPath, ['-e', harness], {
    cwd: dir, env: { ...process.env, GITHUB_WORKSPACE: dir }, encoding: 'utf8'
  });
  assert.strictEqual(result.status, 0, result.stderr || String(result.error));
  return JSON.parse(fs.readFileSync(path.join(dir, 'calls.json'), 'utf8'));
}

describe('issue-to-pr workflow', () => {
  for (const claimedStatus of ['verified', 'no-board']) {
    it(`keeps intake unverified despite a claimed ${claimedStatus} outcome and date`, t => {
      const { dir, existingPath, locationDir } = setup(t);
      const original = fs.readFileSync(existingPath, 'utf8');
      const calls = runIntake(dir, 'New Cafe', claimedStatus);
      const { fields } = parseLocationFile(fs.readFileSync(path.join(locationDir, 'new-cafe.md'), 'utf8'));
      assert.strictEqual(fields.status, 'needs-verification');
      assert.strictEqual(fields.verified_date, undefined);
      assert.strictEqual(fs.readFileSync(existingPath, 'utf8'), original);
      assert.strictEqual(calls.prs.length, 1);
      assert.ok(calls.commands.some(([command, args]) => command === 'git' && args[0] === 'push'));
      const locationsDir = path.join(dir, 'data/locations');
      const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
      assert.ok(readme.includes('New Cafe'));
      assert.ok(!readme.includes(noBoard.name));
      assert.strictEqual(loadLocations(locationsDir).length, 2);
      const validated = validateLocationsDir(locationsDir);
      assert.deepStrictEqual(validated.errors, []);
      assert.strictEqual(validateReadmeInSync(validated.locations, readme).valid, true);
    });
  }

  it('keeps an existing no-board record and directs duplicate submissions to it', t => {
    const { dir, existingPath } = setup(t);
    const original = fs.readFileSync(existingPath, 'utf8');
    const originalReadme = fs.readFileSync(path.join(dir, 'README.md'), 'utf8');
    const calls = runIntake(dir, noBoard.name, 'verified');
    assert.strictEqual(fs.readFileSync(existingPath, 'utf8'), original);
    assert.strictEqual(fs.readFileSync(path.join(dir, 'README.md'), 'utf8'), originalReadme);
    assert.deepStrictEqual(calls.commands, []);
    assert.deepStrictEqual(calls.prs, []);
    assert.strictEqual(calls.comments.length, 1);
    assert.ok(calls.comments[0].includes('data/locations/norfolk/no-board-cafe.md'));
    assert.ok(calls.comments[0].includes('no-board finding'));
  });
});
