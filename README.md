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

# [Glossary to Flashcards](https://rajeshnandipaty.com/projects/glossary-flashcards)

**[Launch Live Demo (bring your own Anthropic API key)](https://huggingface.co/spaces/rajeshnandipaty/glossary-flashcards)**

> Turn photos of book glossaries (or any page with bold vocabulary) into flashcards ready for Anki using Claude vision.

![App with an uploaded glossary page ready to extract](docs/screenshots/01-app.png)

This is a remastered version of a small web app I built as my first real coding project. Photos of glossary pages can still be uploaded but now the app sends them to Claude's vision API. It returns a CSV file that imports cards cleanly into a deck.

## Live demo

A hosted version runs on [Hugging Face Spaces](https://huggingface.co/spaces/rajeshnandipaty/glossary-flashcards). It uses a model where you supply your own key. You paste your own Anthropic API key into the app. It is sent with each extraction request and used to call Claude. It is not stored or logged by the app. Every visitor pays only for their own usage so there is no shared bill to run up. This is what made a public demo practical in the first place.

## Capabilities

Photos go in. The web app sends them to Claude with a prompt asking for term and definition pairs in JSON. The response is parsed into an editable table. You can fix or delete rows before exporting. The CSV download includes header lines specific to Anki that tell it the separator and the note type. Importing then becomes a single click instead of a multistep configuration.

![Extracted terms ready to export](docs/screenshots/02-extracted.png)

After importing the CSV the cards land in an Anki deck with the term on the front and the definition on the back:

![An imported card under review in Anki](docs/screenshots/03-anki.png)

## Motivation

A good way to refresh my foundations is to revisit old projects I had running locally. This is one of them. The friction of typing flashcards by hand is still a real problem and learners want to move faster. Extracting bold terms from ebook and research paper screenshots remains the highest value target for independent learners who want automation.

Tesseract is free and runs locally and handles clean printed text well. Today a lot of useful vocabulary hardly appears in dedicated glossaries. Promising words are instead introduced inline in bold. Consider a sentence such as "Classification is a problem of assigning a label to an unlabeled example." Only one of the three bold words is actually being defined. Working out which bold term is being defined rather than cross referenced is where a vision capable LLM becomes preferable to an OCR and regex pipeline.

## Lessons learned

Most of the work was not in the JavaScript. It was in three places:

- **The prompt.** The single most consequential file in the project is `server.js` and the most consequential part of it is the extraction prompt. Telling the model to skip bold words that are merely referenced rather than defined made a much bigger difference than any code I wrote.

- **Trusting the bytes rather than the labels.** My browser told the server that an uploaded WebP file was `image/jpeg`. Claude's API correctly rejected the mismatch. The fix was to detect the actual format from the file's first few bytes (its "magic numbers") and to ignore what the upload claimed. Real world data lies and the bytes do not.

- **Domain quirks matter.** A plain CSV does not tell Anki anything about which deck to create or which note type to use or how to map columns to fields. My first import dumped every term's definition into the front of the card with no back at all. The fix was learning that Anki supports `#header:value` lines at the top of a CSV file. Examples are `#separator:Comma` and `#deck:NAME` and `#columns:Front,Back` among a few others. Five lines of text made the import work correctly.

## Running it locally

You can run your own copy instead of using the hosted Space. It is a standard Node app.

### Requirements

- Node.js 18+ (use [nvm](https://github.com/nvm-sh/nvm) if you do not have it)
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com). About 5 dollars of credit is plenty.

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

Open `http://localhost:3000`. Paste your Anthropic API key into the field at the top of the page and start uploading. The key is entered in the app itself so there is no `.env` file to set up. `Ctrl+C` in the terminal stops the server.

## Importing into Anki

The downloaded CSV includes Anki header lines so import is one click:

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

Roughly half a penny per page sent to Claude so about $0.50 for 100 pages. This is billed to whichever key is entered. You only ever pay for your own extractions.

## Troubleshooting

**"Invalid API key"** means the key was mistyped or has a stray space or was revoked. Get a fresh one from [console.anthropic.com](https://console.anthropic.com) and paste it again. Keys start with `sk-ant-api03-`.

**"No terms were found"** means you should try a sharper photo with better lighting. Most failures here are image quality.

**Server will not start** usually means something else is using port 3000. Run `PORT=3001 npm start` to use a different port.
