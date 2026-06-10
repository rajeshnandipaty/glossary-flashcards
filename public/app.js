// app.js — frontend logic.
// Reads images, sends them to /api/extract, renders editable cards, exports CSV.

const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const thumbnails = document.getElementById('thumbnails');
const extractBtn = document.getElementById('extract-btn');
const resultsSection = document.getElementById('results-section');
const cardsBody = document.getElementById('cards-body');
const cardCount = document.getElementById('card-count');
const downloadBtn = document.getElementById('download-btn');
const status = document.getElementById('status');
const apiKeyInput = document.getElementById('api-key-input');

let uploadedImages = []; // { dataUrl, base64, mediaType }

// --- File handling ---

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
  for (const file of files) {
    try {
      const dataUrl = await readAsDataURL(file);
      const base64 = dataUrl.split(',')[1];
      uploadedImages.push({ dataUrl, base64, mediaType: file.type });
    } catch (err) {
      console.error('Failed to read file:', file.name, err);
    }
  }
  renderThumbnails();
  extractBtn.disabled = uploadedImages.length === 0;
  // Reset file input so selecting the same file again still fires `change`.
  fileInput.value = '';
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderThumbnails() {
  thumbnails.innerHTML = '';
  uploadedImages.forEach((img, i) => {
    const div = document.createElement('div');
    div.className = 'thumbnail';
    div.innerHTML = `
      <img src="${img.dataUrl}" alt="Page ${i + 1}">
      <button class="remove" data-index="${i}" aria-label="Remove image">✕</button>
    `;
    thumbnails.appendChild(div);
  });

  thumbnails.querySelectorAll('.remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const i = parseInt(e.currentTarget.dataset.index, 10);
      uploadedImages.splice(i, 1);
      renderThumbnails();
      extractBtn.disabled = uploadedImages.length === 0;
    });
  });
}

// --- Extraction ---
extractBtn.addEventListener('click', async () => {
	if (uploadedImages.length === 0) return;

	if (!apiKeyInput.value.trim()) {
		setStatus('error', 'Paste your Anthropic API key above first.');
		return;
	}
}

  extractBtn.disabled = true;
  setStatus(
    'loading',
    `<span class="spinner"></span>Reading ${uploadedImages.length} page${uploadedImages.length > 1 ? 's' : ''}…`
  );

  try {
    const payload = {
      images: uploadedImages.map((img) => ({
        data: img.base64,
        mediaType: img.mediaType,
      })),
    };

    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-api-key': apiKeyInput.value.trim(), 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server error (${response.status})`);
    }

    const { cards } = await response.json();
    renderCards(cards);
  } catch (err) {
    setStatus('error', `Error: ${err.message}`);
    resultsSection.hidden = true;
  } finally {
    extractBtn.disabled = uploadedImages.length === 0;
  }
});

// --- Cards table ---

function renderCards(cards) {
  cardsBody.innerHTML = '';
  cards.forEach((c) => addRow(c.term, c.definition));
  updateCount();
  resultsSection.hidden = cards.length === 0;

  if (cards.length === 0) {
    setStatus('error', 'No terms were found in those images.');
  } else {
    setStatus('', `Found ${cards.length} term${cards.length === 1 ? '' : 's'}.`);
  }
}

function addRow(term, definition) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td contenteditable="true" class="term-cell"></td>
    <td contenteditable="true" class="def-cell"></td>
    <td class="actions-cell"><button class="remove-row" aria-label="Remove row">✕</button></td>
  `;
  // Use textContent (not innerHTML) so any HTML in the term/definition is treated as text.
  row.querySelector('.term-cell').textContent = term;
  row.querySelector('.def-cell').textContent = definition;
  row.querySelector('.remove-row').addEventListener('click', () => {
    row.remove();
    updateCount();
  });
  cardsBody.appendChild(row);
}

function updateCount() {
  const n = cardsBody.children.length;
  cardCount.textContent = `${n} card${n === 1 ? '' : 's'}`;
}

function setStatus(type, html) {
  status.className = type;
  status.innerHTML = html;
}

// --- CSV export ---

downloadBtn.addEventListener('click', () => {
  const rows = Array.from(cardsBody.children)
    .map((row) => [
      row.children[0].textContent.trim(),
      row.children[1].textContent.trim(),
    ])
    .filter(([t, d]) => t && d);

  if (rows.length === 0) {
    setStatus('error', 'Nothing to export — add some terms first.');
    return;
  }

  const deckInput = document.getElementById('deck-name').value.trim();
  const deckName = deckInput || 'Imported Vocabulary';

  // Anki header lines — these tell Anki how to interpret the file so the user
  // doesn't have to set anything manually in the import dialog. Without these,
  // Anki defaults to whatever deck is selected and may dump all columns into
  // the front field of an arbitrary note type.
  // Docs: https://docs.ankiweb.net/importing/text-files.html
  const headers = [
    '#separator:Comma',
    '#html:false',
    '#notetype:Basic',
    `#deck:${deckName}`,
    '#columns:Front,Back',
  ];

  // RFC 4180 quoting: wrap each field in quotes, double up any internal quotes.
  const data = rows.map((row) =>
    row.map((field) => `"${field.replace(/"/g, '""')}"`).join(',')
  );

  const csv = [...headers, ...data].join('\n') + '\n';

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flashcards.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  setStatus(
    '',
    `Exported ${rows.length} card${rows.length === 1 ? '' : 's'} → deck "${deckName}"`
  );
});
