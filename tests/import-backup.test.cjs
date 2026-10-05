const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const KEY = 'badd_personal_workflow_v1';
const sourcePath = path.join(__dirname, '..', 'personal-workflow-engine.html');
const html = fs.readFileSync(sourcePath, 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'the application inline script exists');

const initialData = {
  items: [{ id: 'saved-item', title: 'Keep this', body: 'Existing capture', type: 'Bug', created: 1 }],
  tasks: [{ text: 'Keep this task', done: false, created: 1 }],
  session: null,
  settings: { budget: 1048576 },
};

function createApp(seed = initialData) {
  const values = new Map([[KEY, JSON.stringify(seed)]]);
  const alerts = [];
  const elements = new Map();
  const document = {
    hidden: false,
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, {
          value: '',
          textContent: '',
          innerHTML: '',
          className: '',
          style: {},
          files: [],
          click() {},
        });
      }
      return elements.get(id);
    },
    createElement() {
      return { click() {}, set href(value) { this._href = value; }, get href() { return this._href; } };
    },
  };
  class FileReaderMock {
    readAsText(file) {
      this.result = file.text;
      this.onload();
    }
  }
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
  };

  vm.runInNewContext(script, {
    Blob,
    Date,
    FileReader: FileReaderMock,
    URL: { createObjectURL() { return 'blob:test'; }, revokeObjectURL() {} },
    alert(message) { alerts.push(message); },
    clearTimeout,
    console,
    crypto: { randomUUID: () => 'generated-id' },
    document,
    localStorage,
    setTimeout,
    window: { addEventListener() {} },
  }, { filename: sourcePath });

  return {
    alerts,
    element(id) { return document.getElementById(id); },
    stored() { return JSON.parse(values.get(KEY)); },
    storedText() { return values.get(KEY); },
  };
}

function importBackup(app, backup) {
  const file = app.element('file');
  file.files = [{ text: JSON.stringify(backup) }];
  file.onchange({ target: file });
}

test('rejects malformed nested records without changing the current backup', async (t) => {
  const valid = {
    items: [{ id: 'imported', title: 'Imported', body: 'Text', type: 'Concept', created: 10 }],
    tasks: [{ text: 'Imported task', done: false, created: 10 }],
  };
  const cases = [
    ['null item', { ...valid, items: [null] }],
    ['array item', { ...valid, items: [[]] }],
    ['item missing body', { ...valid, items: [{ id: 'x', title: 'x', type: 'Bug', created: 10 }] }],
    ['non-numeric item timestamp', { ...valid, items: [{ ...valid.items[0], created: 'later' }] }],
    ['null task', { ...valid, tasks: [null] }],
    ['array task', { ...valid, tasks: [[]] }],
    ['task with non-boolean completion state', { ...valid, tasks: [{ text: 'x', done: 'false' }] }],
  ];

  for (const [name, backup] of cases) {
    await t.test(name, () => {
      const app = createApp();
      const beforeText = app.storedText();
      const beforeIdeas = app.element('ideas').innerHTML;
      importBackup(app, backup);
      assert.equal(app.storedText(), beforeText, 'invalid input must not overwrite local storage');
      assert.equal(app.element('ideas').innerHTML, beforeIdeas, 'existing captures must remain rendered');
      assert.deepEqual(app.alerts, ['Invalid workflow backup.']);
      assert.equal(app.stored().items[0].title, 'Keep this');
      assert.equal(app.stored().tasks[0].text, 'Keep this task');
    });
  }
});

test('imports an export-shaped backup containing valid item and task records', () => {
  const app = createApp();
  const backup = {
    items: [{ id: 'new-item', title: 'New capture', body: 'Useful note', type: 'Experiment', created: 12345 }],
    tasks: [{ text: 'Run the experiment', done: false, created: 12346 }],
    session: null,
    settings: { budget: 1048576 },
  };

  importBackup(app, backup);

  assert.equal(app.stored().items[0].id, 'new-item');
  assert.equal(app.stored().tasks[0].text, 'Run the experiment');
  assert.ok(app.alerts.includes('Backup imported and normalized.'));
  assert.ok(app.element('ideas').innerHTML.includes('New capture'));
});
