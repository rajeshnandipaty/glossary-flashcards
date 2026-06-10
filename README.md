---
title: Glossary Flashcards
emoji: 📚
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
license: mit
---

# Glossary → Flashcards

> Turn photos of book glossaries (or any page with bold vocab) into Anki-importable flashcards using Claude vision.

![App with an uploaded glossary page ready to extract](docs/screenshots/01-app.png)

This is a remastered version of a small web app I built as my first real coding project. Photos of glossary pages can still be uploaded, but now the app sends them to Claude's vision API. It returns a CSV file which imports cards cleanly into a deck.

## What it does

Photos go in, the web app sents them to Claude with a prompt asking for term/definition pairs in JSON, and the response gets parsed into an editable table. You can fix or delete rows before exporting. The CSV download includes Anki-specific header lines that tell Anki the separator, and the note type. Importing then becomes a one-click wonder instead of a multi-step configuration.

![Extracted terms ready to export](docs/screenshots/02-extracted.png)

After importing the CSV, the cards land in an Anki deck with the term on the front and the definition on the back:

![An imported card mid-review in Anki](docs/screenshots/03-anki.png)

## Why I upgraded it

I figured a great way to refresh my foundations is to revisit old projects I had running locally. This is one of them. The friction of manually typing flashcards is still relevant, and everyone demands a higher learning rate. Extracting bold terms from e-book (and potentially research papers) screenshots continue to bring the highest-value target for independent learners seeking automation.

Tesseract is free, runs locally, and handles clean printed text well. These days, a lot of useful vocabulary hardly exists in dedicated glossaries. Promosing words are instead introduced in bold inline. In a sentence like "Classification is a problem of assigning a label to an unlabeled example," only one of the three bolded words is actually being defined. Figuring out which bold term is being defined (vs. cross-referenced) is where a vision-capable LLM becomes preferable over an OCR-plus-regex pipeline.

## What I learned

Most of the work wasn't in the JavaScript. It was in:

- **The prompt.** The single most consequential file in the project is `server.js`, and the most consequential part of it is the extraction prompt. Telling the model to skip bold words that are merely referenced (not defined) made a much bigger difference than any code I wrote.

- **Trusting the bytes, not the labels.** My browser told the server that an uploaded WebP file was `image/jpeg`. Claude's API correctly rejected the mismatch. The fix was sniffing the actual format from the file's first few bytes ("magic numbers") and ignoring what the upload claimed. Real-world data lies; the bytes don't.

- **Domain quirks matter.** A plain CSV doesn't tell Anki anything about which deck to create, which note type to use, or how to map columns to fields. My first import dumped every term's definition into the front of the card with no back at all. The fix was learning that Anki supports `#header:value` lines at the top of CSV files — `#separator:Comma`, `#deck:NAME`, `#columns:Front,Back`, and a few others. Five lines of text made the import "just work."

## Setup

### Requirements

- Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm) if you don't have it)
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com) — 5 dollars of credit is plenty

### Install

```bash
git clone https://github.com/rajeshnandipaty/glossary-flashcards.git
cd glossary-flashcards
npm install
cp .env.example .env
```

Then open `.env` and paste your API key. The line should look like:

```
ANTHROPIC_API_KEY=sk-ant-api03-XXXXXXXXXXXXXX...
```

### Run

```bash
npm start
```

Open `http://localhost:3000` in your browser. `Ctrl+C` in the terminal stops it.

## Importing into Anki

The downloaded CSV includes Anki header lines, so import is one click:

1. `File → Import` in Anki
2. Pick `flashcards.csv`
3. Click **Import**

A new deck appears with the name you typed in the app.

## Why this isn't hosted publicly

Every extraction makes a paid API call against my account and... I will not pay for anyone's usage. Hosting a public demo also means any visitor can run up the bill, and the abuse mitigations needed to prevent that (rate limiting, captchas, etc.) would be more engineering than the app itself. So it runs locally, the source is here, and a demo video is on [my portfolio](https://rajeshnandipaty.com).

## Project layout

```
glossary-flashcards/
├── server.js              Express backend. Holds the API key, talks to Claude, sniffs image types.
├── public/
│   ├── index.html         UI shell
│   ├── style.css          Styling
│   └── app.js             Upload handling, table editing, CSV export
├── package.json
├── .env.example           Template — copy to .env and add your key
├── .gitignore             Keeps .env and node_modules out of git
└── docs/screenshots/      README screenshots
```

## Cost

To further emphasize: roughly 1/2 a penny per page sent to Claude, so 100 pages costs about $0.50.

## Troubleshooting

**"ANTHROPIC_API_KEY is missing"** — `.env` isn't there or doesn't have your real key. Copy `.env.example` to `.env` and edit.

**"No terms were found"** — try a sharper, better-lit photo. Most failures here are image quality.

**Server won't start** — something else may be using port 3000. Run `PORT=3001 npm start` to use a different port.
