# BAD-D Personal Workflow Engine

A small, single-page HTML tool for capturing useful ideas and keeping a short queue of concrete next actions. The application is in [`personal-workflow-engine.html`](personal-workflow-engine.html).

## Quick start

1. Open `personal-workflow-engine.html` in a modern web browser with JavaScript enabled.
2. Use **Start productive session** if you want the page to show an active session. This is optional; you can capture ideas and tasks without starting one.
3. No build or package-install step is present in this repository; the app is a standalone HTML file.

The page saves its data in the browser's local storage. Keep using the same browser and profile to find the same saved data. Browser handling of local HTML files can vary.

## Capture ideas and manage tasks

- In **Capture → Shape → Test → Keep**, enter a work title and an idea or observation, choose a type, then select **Save useful item**. Available types are Concept, Bug, Experiment, Workflow, Music, and Question. The list renders at most the 30 newest captures; cleanup may retain up to 500 items, subject to deduplication and the selected budget.
- In **Workflow queue**, enter a concrete next action and select **Add task**. Use its checkbox to mark a task complete.
- **Start productive session** marks a session active. A session older than eight hours is cleared when the page loads again.
- **Clean now** runs the cleanup routine. The **Persistent-data budget** selector offers 512 KB, 1 MB, 2 MB, and 5 MB. Cleanup removes duplicate captures, trims older items when the selected budget is exceeded, and keeps at most 200 tasks. The page also removes temporary-tagged items older than 30 days.

The **Stored data** figure and budget checks use the byte size of the serialized JSON state (`JSON.stringify(db)`, measured with `Blob`). This is an app-side estimate, not the browser's actual storage quota or total storage use.

## Export and import a backup

- Select **Export my useful data** to download a JSON file named `personal-workflow-backup.json`.
- To restore a backup, select **Import backup** and choose a JSON file. Import checks that the parsed JSON has top-level `items` and `tasks` arrays, but does not validate individual entries against a schema; it then runs cleanup.
- Importing can replace the current saved items and tasks. Export the current data first if you may need to keep it. Cleanup in the app does not delete backup files you have already exported.

## Where your data lives

The app stores its working data in browser `localStorage` on the device/browser context where you open it. Its current source uses no account, network, analytics, or cloud-storage service. Data is not automatically synced or backed up, and clearing browser data or losing access to that browser profile may remove it. Export a JSON backup if you want a separate copy.

“Device-local” does not mean encrypted: the app stores the data as JSON in browser storage and provides no sign-in or access-control feature. Avoid entering sensitive information on a shared or untrusted device.
