const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');
const zlib = require('zlib');

function computeSha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function extractTxtMd(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return {
    text: text.trim(),
    isReliable: true,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    needsReview: false,
    reviewReason: null
  };
}

function extractDocx(filePath) {
  const psScript = '$OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ' +
    'Add-Type -AssemblyName System.IO.Compression.FileSystem; ' +
    '$zip = [System.IO.Compression.ZipFile]::OpenRead("' + filePath.replace(/\\/g, '\\\\') + '"); ' +
    '$entry = $zip.GetEntry("word/document.xml"); ' +
    'if ($entry) { ' +
      '$reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8); ' +
      '$xml = $reader.ReadToEnd(); ' +
      '$reader.Close(); ' +
      '$zip.Dispose(); ' +
      '[Console]::Out.Write($xml); ' +
    '} else { ' +
      '$zip.Dispose(); ' +
    '}';
  try {
    const rawXml = execFileSync('powershell', ['-NoProfile', '-Command', psScript], { maxBuffer: 20 * 1024 * 1024, encoding: 'utf8' });
    if (!rawXml) {
      return { text: '', isReliable: false, wordCount: 0, needsReview: true, reviewReason: 'Empty or invalid DOCX content' };
    }
    const text = rawXml
      .replace(/<\/w:p>/g, '\n')
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return {
      text,
      isReliable: true,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      needsReview: false,
      reviewReason: null
    };
  } catch (err) {
    return { text: '', isReliable: false, wordCount: 0, needsReview: true, reviewReason: 'DOCX extraction error: ' + err.message };
  }
}

function extractPptx(filePath) {
  const psScript = '$OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ' +
    'Add-Type -AssemblyName System.IO.Compression.FileSystem; ' +
    '$zip = [System.IO.Compression.ZipFile]::OpenRead("' + filePath.replace(/\\/g, '\\\\') + '"); ' +
    '$texts = @(); ' +
    'foreach ($entry in $zip.Entries) { ' +
      'if ($entry.FullName -like "ppt/slides/slide*.xml") { ' +
        '$reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8); ' +
        '$texts += $reader.ReadToEnd(); ' +
        '$reader.Close(); ' +
      '} ' +
    '}; ' +
    '$zip.Dispose(); ' +
    '[Console]::Out.Write(($texts -join [char]10)); ';
  try {
    const rawXml = execFileSync('powershell', ['-NoProfile', '-Command', psScript], { maxBuffer: 20 * 1024 * 1024, encoding: 'utf8' });
    if (!rawXml) {
      return { text: '', isReliable: false, wordCount: 0, needsReview: true, reviewReason: 'Empty or invalid PPTX content' };
    }
    const text = rawXml
      .replace(/<\/a:p>/g, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return {
      text,
      isReliable: true,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      needsReview: false,
      reviewReason: null
    };
  } catch (err) {
    return { text: '', isReliable: false, wordCount: 0, needsReview: true, reviewReason: 'PPTX extraction error: ' + err.message };
  }
}

function extractPdf(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    const str = buf.toString('latin1');
    const streamMatches = [...str.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)];

    // Parse CMaps
    const cmapMap = new Map();
    streamMatches.forEach(m => {
      try {
        const inflated = zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
        if (inflated.includes('beginbfchar') || inflated.includes('beginbfrange')) {
          const bfcharMatches = [...inflated.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)];
          bfcharMatches.forEach(b => {
            const cid = parseInt(b[1], 16);
            const u = String.fromCharCode(parseInt(b[2], 16));
            cmapMap.set(cid, u);
          });
          const bfrangeMatches = [...inflated.matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)];
          bfrangeMatches.forEach(b => {
            const start = parseInt(b[1], 16);
            const end = parseInt(b[2], 16);
            const uStart = parseInt(b[3], 16);
            for (let cid = start; cid <= end; cid++) {
              cmapMap.set(cid, String.fromCharCode(uStart + (cid - start)));
            }
          });
        }
      } catch (e) {}
    });

    let fullText = '';
    let hebrewCharCount = 0;

    streamMatches.forEach(m => {
      try {
        const inflated = zlib.inflateSync(Buffer.from(m[1], 'latin1')).toString('latin1');
        if (inflated.includes('BT') && inflated.includes('ET')) {
          const hexTokens = [...inflated.matchAll(/<([0-9A-Fa-f]+)>/g)];
          hexTokens.forEach(tok => {
            const hex = tok[1];
            for (let i = 0; i < hex.length; i += 4) {
              const cid = parseInt(hex.substring(i, i + 4), 16);
              if (cmapMap.has(cid)) {
                const ch = cmapMap.get(cid);
                fullText += ch;
                if (ch >= '\u0590' && ch <= '\u05FF') hebrewCharCount++;
              }
            }
          });

          const tjMatches = [...inflated.matchAll(/\((.*?)\)\s*Tj/g)];
          tjMatches.forEach(t => {
            fullText += t[1] + ' ';
          });
        }
      } catch (e) {}
    });

    const clean = fullText.replace(/\s+/g, ' ').trim();

    // Check if Hebrew characters are in visual (reversed) order, e.g. "ךוניח" instead of "חינוך"
    const isReversedHebrew = clean.includes('ךוניח') || clean.includes('לארשי') || clean.includes('עצמ') || clean.includes('דוגיא');

    if (isReversedHebrew) {
      // As requested: If PDF text extraction produces visual reversed order or complex encoding,
      // flag as needs_review to prevent mangling Hebrew without an ad-hoc hacky parser.
      return {
        text: clean,
        isReliable: false,
        wordCount: clean.split(/\s+/).filter(Boolean).length,
        needsReview: true,
        reviewReason: 'PDF uses visual RTL character ordering (needs human review / PDF normalization in V1)'
      };
    }

    const words = clean.split(/\s+/).filter(Boolean);
    if ((hebrewCharCount > 30 && words.length >= 10) || (clean.length > 150 && words.length >= 20)) {
      return {
        text: clean,
        isReliable: true,
        wordCount: words.length,
        needsReview: false,
        reviewReason: null
      };
    }

    return {
      text: clean,
      isReliable: false,
      wordCount: clean.split(/\s+/).filter(Boolean).length,
      needsReview: true,
      reviewReason: 'PDF extraction yielded low text density (scanned image or unsupported font encoding)'
    };
  } catch (err) {
    return {
      text: '',
      isReliable: false,
      wordCount: 0,
      needsReview: true,
      reviewReason: 'PDF read error: ' + err.message
    };
  }
}

function extractFile(filePath, fileType) {
  const ext = (fileType || path.extname(filePath)).toLowerCase().replace(/^\./, '');
  if (ext === 'txt' || ext === 'md') {
    return extractTxtMd(filePath);
  } else if (ext === 'docx') {
    return extractDocx(filePath);
  } else if (ext === 'pptx') {
    return extractPptx(filePath);
  } else if (ext === 'pdf') {
    return extractPdf(filePath);
  } else {
    return {
      text: '',
      isReliable: false,
      wordCount: 0,
      needsReview: true,
      reviewReason: 'Unsupported file type: ' + ext
    };
  }
}

module.exports = {
  computeSha256,
  extractFile,
  extractTxtMd,
  extractDocx,
  extractPptx,
  extractPdf
};