# Pinboard

A local-first desktop app for tracking action items by person. All data is stored on your machine — no account, no sync, no cloud.

Built with Electron, React, TypeScript, Tailwind CSS, and SQLite.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- npm (comes with Node.js)

### Installation

```bash
git clone https://github.com/quinn-johnson/pinboard-app.git
cd pinboard-app
npm install
```

### Running the App

```bash
npm run dev
```

This starts the app at `http://localhost:5173/`. Your data is stored locally in a SQLite database in your OS app data directory — nothing is written to the project folder.

---

## Features

### Parties
Parties are the people or groups you track action items against — teammates, clients, direct reports, etc.

- **Add a party** — click the `+` button in the sidebar to create a new party
- **Rename a party** — hover over a party name in the sidebar and click the pencil icon
- **Filter by party** — click any party in the sidebar to see only their items
- Each party shows a live count of their open items, and a pulsing 🔔 badge if any items have due reminders

### Action Items
Each item is a piece of work tagged to one or more parties.

- **Create an item** — type in the input at the top of the main panel, select at least one party, and hit Enter or click Add
- **Complete an item** — check the checkbox on the left; completed items are dimmed and hidden from counts
- **Edit an item** — click the pencil icon on the right to edit the text inline
- **Manage parties on an item** — click the tag icon to add or remove parties from an existing item
- Items support **Markdown formatting** in their text (see below)

### Starred Items
Star high-priority items to surface them in a dedicated view.

- **Star/unstar** — click the ★ icon next to the checkbox on any item
- **Starred view** — click "Starred" in the sidebar to see all starred open items
- Starred items are highlighted with a yellow background

### Reminders
Set a date and time reminder on any item.

- **Set a reminder** — click the 🔔 bell icon on an item to pick a date and time
- **Clear a reminder** — open the reminder picker and click "Clear Reminder"
- When a reminder is due, the item card turns orange and the sidebar shows a pulsing 🔔 badge
- Reminders are checked every 30 seconds automatically

### Notes & Context (Threads)
Attach running notes to any item — useful for tracking context, links, or updates over time.

- **View notes** — click the speech bubble icon on an item (shows a count badge if notes exist)
- **Add a note** — click "+ Add Note" within the notes panel and type your note
- **Delete a note** — hover over a note and click the trash icon
- Notes support **Markdown formatting**

### Markdown Formatting
Item text and notes support a subset of Markdown:

| Syntax | Result |
|--------|--------|
| `**bold**` or `__bold__` | **bold** |
| `*italic*` or `_italic_` | *italic* |
| `~~strikethrough~~` | ~~strikethrough~~ |
| `- item` or `* item` | bullet list |
| `https://...` | clickable link |

### Views
The sidebar provides three views:

| View | Shows |
|------|-------|
| All Items | Every open item across all parties |
| Starred | Open items that have been starred |
| [Party name] | Open items tagged to that specific party |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Desktop shell | [Electron](https://www.electronjs.org/) |
| Frontend | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| State management | [Zustand](https://github.com/pmndrs/zustand) |
| Database | [SQLite](https://www.sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Build tool | [Vite](https://vitejs.dev/) |

---

## Data & Privacy

All data lives in your OS user data directory (e.g. `~/Library/Application Support/pinboard-app/` on macOS). Nothing is sent anywhere. Deleting the app does not delete your data — you would need to manually remove that directory.
