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

# [Glossary → Flashcards](https://rajeshnandipaty.com/notes/glossary-flashcards)

**[Launch Live Demo (bring your own Anthropic API key)](https://huggingface.co/spaces/rajeshnandipaty/glossary-flashcards)**

> Turn photos of book glossaries (or any page with bold vocab) into Anki-importable flashcards using Claude vision.

![App with an uploaded glossary page ready to extract](docs/screenshots/01-app.png)

This is a remastered version of a small web app I built as my first real coding project. Photos of glossary pages can still be uploaded, but now the app sends them to Claude's vision API. It returns a CSV file which imports cards cleanly into a deck.

## Live demo

A hosted version runs on [Hugging Face Spaces](https://huggingface.co/spaces/rajeshnandipaty/glossary-flashcards). It uses a **bring-your-own-key** model: you paste your own Anthropic API key into the app, it's sent with each extraction request, used to call Claude, and is not stored or logged by the app. Every visitor pays only for their own usage, so there's no shared bill to run up — which is what made a public demo practical in the first place.

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

## Running it locally

Prefer to run your own copy instead of using the hosted Space? It's a standard Node app.

### Requirements

- Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm) if you don't have it)
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com) — 5 dollars of credit is plenty

### Install

```bash
git clone https://github.com/rajeshnandipaty/glossary-flashcards.git
cd glossary-flashcards
npm install
```

### Run

```bash
npm start
```

Open `http://localhost:3000`, paste your Anthropic API key into the field at the top of the page, and start uploading. The key is entered in the app itself — there's no `.env` file to set up. `Ctrl+C` in the terminal stops the server.

## Importing into Anki

The downloaded CSV includes Anki header lines, so import is one click:

1. `File → Import` in Anki
2. Pick `flashcards.csv`
3. Click **Import**

A new deck appears with the name you typed in the app.

## Project layout

```
glossary-flashcards/
├── server.js              Express backend. Receives the key with each request, talks to Claude, sniffs image types.
├── Dockerfile             Container build used by Hugging Face Spaces.
├── public/
│   ├── index.html         UI shell
│   ├── style.css          Styling
│   └── app.js             Upload handling, table editing, CSV export
├── package.json
├── .gitignore             Keeps .env and node_modules out of git
└── docs/screenshots/      README screenshots
```

## Cost

Roughly half a penny per page sent to Claude, so about $0.50 for 100 pages — billed to whichever key is entered. You only ever pay for your own extractions.

## Troubleshooting

**"Invalid API key"** — the key was mistyped, has a stray space, or was revoked. Grab a fresh one from [console.anthropic.com](https://console.anthropic.com) and paste it again. Keys start with `sk-ant-api03-`.

**"No terms were found"** — try a sharper, better-lit photo. Most failures here are image quality.

**Server won't start** — something else may be using port 3000. Run `PORT=3001 npm start` to use a different port.
