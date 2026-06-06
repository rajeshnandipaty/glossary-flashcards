// server.js — tiny Express server that holds the API key and talks to Claude.
//
// The frontend never sees your API key. It posts images here; this server
// adds the key, calls Claude's vision API, and returns clean term/definition pairs.

require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies. Images get base64-encoded so requests can be large.
app.use(express.json({ limit: '25mb' }));
app.use(express.static('public'));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n❌ ANTHROPIC_API_KEY is missing.');
  console.error('   Copy .env.example to .env and paste your key into it.\n');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Detect the real image format from the first few bytes ("magic numbers").
// Browsers sometimes mislabel file.type (especially on Linux), and Claude
// rejects requests where the declared media_type doesn't match the bytes.
function detectImageMediaType(base64) {
  const head = Buffer.from(base64.slice(0, 32), 'base64');
  // JPEG: FF D8 FF
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) return 'image/png';
  // GIF: 47 49 46 38 ("GIF8")
  if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x38) return 'image/gif';
  // WebP: "RIFF" .... "WEBP"
  if (
    head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46 &&
    head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50
  ) return 'image/webp';
  return null;
}

const EXTRACTION_PROMPT = `You are looking at one or more pages from a book. Extract every term that is being DEFINED on these pages, along with its definition.

Two cases to handle:

1. GLOSSARY PAGES — terms are listed with their definitions (often bold term followed by definition text).

2. REGULAR PROSE PAGES — bold or italic text introduces new vocabulary inline. CRITICAL: only extract a term if the surrounding sentence actually defines or explains it. Skip bold words that are merely referenced, cross-referenced, or used as examples. For instance, in "Classification is a problem of automatically assigning a label to an unlabeled example", only "Classification" is being defined — "label" and "unlabeled example" are not.

For each term you extract:
- "term": the word or phrase being defined. Strip part-of-speech tags (noun, verb), pronunciation guides, and parenthetical abbreviations unless they ARE the term. Keep the term as the reader would search for it.
- "definition": a clean, self-contained definition. Merge multi-line definitions into one. Strip figure/chapter references like "(Figure 2-3)" or "(see Chapter 4)". Do not include the term itself in its own definition.

Return ONLY a valid JSON array. No markdown, no commentary, no code fences. Format:
[
  {"term": "...", "definition": "..."},
  {"term": "...", "definition": "..."}
]

If no terms are being defined, return: []`;

app.post('/api/extract', async (req, res) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided.' });
    }

    // Build the content array: all images, then the instructions.
    // We sniff the actual media type from the bytes rather than trusting the
    // browser-supplied type — see detectImageMediaType above.
    const content = images.map((img) => {
      const detected = detectImageMediaType(img.data);
      if (!detected) {
        throw new Error('Unsupported or unrecognized image format. Use JPEG, PNG, GIF, or WebP.');
      }
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: detected,
          data: img.data,
        },
      };
    });
    content.push({ type: 'text', text: EXTRACTION_PROMPT });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    });

    // Collect text from response blocks.
    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Strip any stray code fences and parse.
    const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();

    let cards;
    try {
      cards = JSON.parse(cleaned);
    } catch (e) {
      console.error('Could not parse model response:', text);
      return res.status(502).json({
        error: 'The model response was not valid JSON. Try with clearer photos.',
      });
    }

    if (!Array.isArray(cards)) {
      return res.status(502).json({ error: 'Unexpected response shape.' });
    }

    // Validate shape and drop anything malformed.
    cards = cards
      .filter((c) => c && typeof c.term === 'string' && typeof c.definition === 'string')
      .map((c) => ({ term: c.term.trim(), definition: c.definition.trim() }))
      .filter((c) => c.term && c.definition);

    res.json({ cards });
  } catch (err) {
    console.error('Extraction error:', err);
    const message = err?.message || 'Unknown error';
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`\n📚 Glossary → Flashcards running at http://localhost:${PORT}\n`);
});
