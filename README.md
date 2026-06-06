# Glossary → Flashcards

Turn photos of book glossaries — or any page with bold vocab — into a CSV file you can import into Anki or Quizlet.

## How it works

1. You drop in one or more images of book pages.
2. The app sends them to Claude, which extracts every defined term and its definition.
3. You review and edit the results in a table.
4. You download a CSV. You import it into Anki. Done.

## Setup (one time)

### 1. Make sure Node.js is installed

```bash
node --version
```

If that prints something like `v20.x.x`, you're good. If not, install [nvm](https://github.com/nvm-sh/nvm) first.

### 2. Install dependencies

From inside this folder:

```bash
npm install
```

This downloads Express, dotenv, and the Anthropic SDK into a `node_modules/` folder. Takes a few seconds.

### 3. Add your API key

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` in any text editor and replace the placeholder with your real key from [console.anthropic.com](https://console.anthropic.com). The line should end up looking like:

```
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXX...
```

Save and close. **Do not commit `.env` to git** — `.gitignore` already excludes it.

## Running

```bash
npm start
```

You'll see:

```
📚 Glossary → Flashcards running at http://localhost:3000
```

Open that URL in your browser. Drop in some glossary images. Hit "Extract terms."

When you're done, press `Ctrl+C` in the terminal to stop the server.

## Importing into Anki

The downloaded CSV includes header lines that tell Anki everything it needs to know — which separator to use, which note type to apply, and which deck to put the cards in. You just confirm the import.

1. Open Anki.
2. `File → Import`.
3. Pick the downloaded `flashcards.csv`.
4. The import dialog will show the headers were detected. Click **Import**.
5. A new deck appears in your collection with the name you typed in the app (default: "Imported Vocabulary").

## Project layout

```
glossary-flashcards/
├── server.js           Backend (~80 lines). Holds your API key, talks to Claude.
├── public/
│   ├── index.html      The web page.
│   ├── style.css       Styles.
│   └── app.js          Frontend logic — uploads, table, CSV export.
├── package.json        Lists the Node dependencies.
├── .env.example        Template — copy to .env and add your key.
├── .gitignore          Keeps node_modules and .env out of git.
└── README.md           This file.
```

## Cost

Each page sent to Claude costs roughly half a cent. A 100-page session costs around 50¢. Your $5 of credit is plenty.

## Troubleshooting

**"ANTHROPIC_API_KEY is missing"** — you skipped step 3. Make sure `.env` (not `.env.example`) exists in this folder and contains your real key.

**"No terms were found"** — the image may be too blurry, too dark, or genuinely have no defined terms. Try a clearer photo.

**The server won't start** — make sure nothing else is using port 3000, or change `PORT=3001` in front of `npm start`.

**The model returns junk JSON** — rare but can happen on weird page layouts. Just try again, or use a different image.
