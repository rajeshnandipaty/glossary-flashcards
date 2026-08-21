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

**[Launch Live Demo](https://huggingface.co/spaces/rajeshnandipaty/glossary-flashcards)**

> Turn photos of book glossaries, or any page with bold vocabulary, into flashcards ready for Anki using Claude's vision capabilities.

![App with an uploaded glossary page ready to extract](docs/screenshots/01-app.png)

This project is a remastered version of a small web app I built as my first real coding project. Users can upload photos of glossary pages, and the app processes them using Claude's vision API. The extracted terms and definitions are returned as a CSV file that can be imported directly into an Anki deck.

## Live Demo

A hosted version of the app is available on [Hugging Face Spaces](https://huggingface.co/spaces/rajeshnandipaty/glossary-flashcards). The demo uses a bring-your-own-key model. You enter your own Anthropic API key directly into the app. The key is sent with each extraction request to authenticate with Claude. The app does not store or log your key. Each visitor is responsible for their own API usage and associated costs. This avoids a shared API bill and makes it practical to offer the demo publicly.

## How It Works

Upload a photo of a glossary page, and the web page sends it to Claude with a prompt requesting term and definition pairs in JSON format. The response is parsed into an editable table, where you can review, edit or delete entries before exporting. The CSV download includes Anki-specific header lines that define the field separator and note type. This allows the file to be imported directly into Anki without additional configuration.

![Extracted terms ready for export](docs/screenshots/02-extracted.png)

After importing the CSV, the cards are added to an Anki deck with the term on the front and the definition on the back:

![Imported Anki card under review in Anki](docs/screenshots/03-anki.png)

## Background

One way I refresh my foundations is by revisiting older projects that I still have running locally. This is one of them. Manually creating flashcards remains tedious, and learners benefit from a faster way to turn useful vocabulary into study material. Extracting bold terms from ebook and research paper screenshots is particularly valuable for independent learners who want to automate this process.

Tesseract is free, runs locally, and handles clean printed text well. However, useful vocabulary often appears outside dedicated glossaries. Terms are frequently introduced inline in bold. Consider a sentence such as "Classification is a problem of assigning a label to an unlabeled example." Only one of the three bold terms is actually being defined. Determining which term is being defined, rather than merely identifying or cross-referencing it, is where a vision-capable LLM has an advantage over a traditional OCR and regex pipeline.

## Key Takeaways

Most of the work was not in the JavaScript. It was concentrated in three places:

- **The Prompt.** The single most consequential file in the project is `server.js`, and the most important part of that file is the extraction prompt. Telling the model to skip bold words that are referenced rather than defined made a much bigger difference than any code change.

- **Trust the bytes, not the labels.** My browser reported an uploaded WebP file as `image/jpeg`, which caused Claude's API to reject it. The fix was to detect the actual file format from its first few bytes, known as "magic numbers," and ignore the reported MIME type. Real-world data can be unreliable. The bytes are the source of truth.

- **Domain quirks matter.** A plain CSV does not tell Anki which deck to use, which note type to create, or how to map columns to fields. My first import put every definition on the front of the card and left the back empty. The fix was learning that Anki supports `#header:value` lines at the top of a CSV file, such as `#separator:Comma`, `#deck:NAME`, and `#columns:Front,Back`. A few lines of metadata were enough to make the import work correctly.

## Run Locally

You can run your own copy instead of using the hosted Space. The app is a standard Node.js application.

### Requirements

- Node.js 18 or later. If Node.js is not installed, [nvm](https://github.com/nvm-sh/nvm) is a convenient way to install and manage it.
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com). A small amount of API credit is sufficient for testing the app.

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

Open `http://localhost:3000` in your browser. Enter your Anthropic API key in the field at the top of the page, then start uploading images. The API key is entered directly in the app, so no `.env` file or additional environment configuration is required. Press `Ctrl+C` in the terminal to stop the server.

## Importing into Anki

The downloaded CSV includes the Anki-specific header lines, so importing the flashcards takes just a few steps:

1. Select `File → Import` in Anki.
2. Select `flashcards.csv`.
3. Click **Import**.

Anki creates a new deck using the name you entered in the app.

## Project Structure

```
glossary-flashcards/
├── server.js              Express backend. Handles requests, communicates with Claude, and detects image formats.
├── Dockerfile             Container configuration for Hugging Face Spaces.
├── public/
│   ├── index.html         Application interface.
│   ├── style.css          Application styling.
│   └── app.js             Upload handling, table editing, CSV export.
├── package.json           Node.js dependencies and scripts.
├── .gitignore             Excludes .env and node_modules from version control.
└── docs/screenshots/      Screenshots used in the README.
```

## Cost

Each page costs roughly half a cent to process with Claude, or about $0.50 for 100 pages. Charges are billed to the Anthropic account associated with the API key entered in the app. You only pay for your own extractions.

## Troubleshooting

**"Invalid API key"** usually means the key was entered incorrectly, contains extra whitespace, or has been revoked. Create a new key at [console.anthropic.com](https://console.anthropic.com) and try again. Anthropic API keys typically begin with `sk-ant-api03-`.

**"No terms were found"** usually indicates an image quality issue. Try a sharper photo with better lighting and make sure the text is clearly visible.

**The server will not start** usually means port 3000 is already in use. Start the app on a different port with `PORT=3001 npm start`.
