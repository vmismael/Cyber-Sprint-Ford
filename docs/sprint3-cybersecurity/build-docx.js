// Gera o Word da entrega (Sprint3-Cybersecurity-Ford-Intelligence.docx) a partir de documento.md.
//
// Uso, dentro desta pasta:
//   npm i --no-save docx
//   node build-docx.js [saida.docx]
//
// Sintaxe aceita em documento.md: #, ##, ### (títulos), tabelas com |, blocos ```lang,
// listas com "- " e "1. ", imagens ![legenda](arquivo.png), linhas "> [PRINT] ..." (viram a
// caixa amarela de evidências) e a linha <<<PAGEBREAK>>> (quebra de página).
// Inline: **negrito**, *itálico*, `código`.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, ImageRun, PageBreak, Header, Footer, PageNumber,
  TableOfContents, LevelFormat, TabStopType, VerticalAlign,
} = require('docx');

const DIR = __dirname;
const SRC = fs.readFileSync(path.join(DIR, 'documento.md'), 'utf8').split('\n');

const BLUE = '1F3A5F';
const CONTENT_W = 9638; // A4 com margens de 2 cm, em DXA
const FONT = 'Arial';
const MONO = 'Consolas';

// ---------- inline: **negrito**, *itálico*, `código` ----------
function inline(text, base = {}) {
  const runs = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith('**')) runs.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else if (t.startsWith('`')) runs.push(new TextRun({ text: t.slice(1, -1), font: MONO, size: (base.size || 21) - 2, color: '8A1C3C', ...base, bold: base.bold }));
    else runs.push(new TextRun({ text: t.slice(1, -1), italics: true, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...base }));
  return runs;
}

const para = (text, opts = {}) =>
  new Paragraph({ spacing: { after: 120, line: 300 }, ...opts, children: inline(text, opts.run || {}) });

// ---------- tabelas ----------
function table(lines) {
  const rows = lines
    .filter((l) => !/^\|\s*-/.test(l))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()));
  const ncol = rows[0].length;
  const small = ncol >= 6;
  const size = small ? 15 : ncol >= 4 ? 17 : 19;

  // Larguras: cada coluna recebe no mínimo a sua palavra mais longa (nada quebra no meio
  // de uma palavra) e o espaço que sobra vai para as colunas com mais texto.
  const charW = size * 5.6;
  const plain = (t) => (t || '').replace(/[*`]/g, '');
  // Palavra mais longa da coluna; texto em `código` (monoespaçado) e cabeçalho (negrito) ocupam mais.
  const wordW = (cell, header) => {
    const mono = /`/.test(cell || '') ? 1.35 : 1;
    const bold = header ? 1.12 : 1;
    return Math.max(...plain(cell).split(/\s+/).map((w) => w.length)) * charW * mono * bold;
  };
  const minW = Array.from({ length: ncol }, (_, i) =>
    Math.ceil(Math.max(...rows.map((r, ri) => wordW(r[i], ri === 0))) + 320),
  );
  const prefW = Array.from({ length: ncol }, (_, i) =>
    Math.ceil(Math.min(48, Math.max(...rows.map((r) => plain(r[i]).length))) * charW + 200),
  );
  let widths;
  const sumMin = minW.reduce((a, b) => a + b, 0);
  if (sumMin >= CONTENT_W) widths = minW.map((w) => Math.floor((w / sumMin) * CONTENT_W));
  else {
    // sobra distribuída pelo tamanho médio do texto de cada coluna
    const body = rows.slice(1);
    const avg = Array.from({ length: ncol }, (_, i) => body.reduce((t, r) => t + plain(r[i]).length, 0) / Math.max(1, body.length));
    const extra = avg.map((a, i) => (prefW[i] > minW[i] ? a : 0));
    const sumExtra = extra.reduce((a, b) => a + b, 0) || 1;
    const room = CONTENT_W - sumMin;
    widths = minW.map((w, i) => Math.floor(w + (extra[i] / sumExtra) * room));
  }
  widths[ncol - 1] += CONTENT_W - widths.reduce((a, b) => a + b, 0);

  const border = { style: BorderStyle.SINGLE, size: 4, color: 'B8C4D4' };
  const borders = { top: border, bottom: border, left: border, right: border };

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map((r, ri) =>
      new TableRow({
        tableHeader: ri === 0,
        cantSplit: true,
        children: r.map((cell, ci) =>
          new TableCell({
            width: { size: widths[ci], type: WidthType.DXA },
            borders,
            verticalAlign: VerticalAlign.CENTER,
            shading: ri === 0 ? { type: ShadingType.CLEAR, fill: BLUE, color: 'auto' } : ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: 'F6F8FB', color: 'auto' } : undefined,
            margins: { top: 50, bottom: 50, left: 80, right: 80 },
            children: [
              new Paragraph({
                spacing: { after: 0, line: 260 },
                children: inline(cell, ri === 0 ? { bold: true, color: 'FFFFFF', size } : { size }),
              }),
            ],
          }),
        ),
      }),
    ),
  });
}

// ---------- bloco de código ----------
function codeBlock(lines, lang) {
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'D0D7E2' };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            borders: { top: border, bottom: border, right: border, left: { style: BorderStyle.SINGLE, size: 18, color: BLUE } },
            shading: { type: ShadingType.CLEAR, fill: 'F4F6F9', color: 'auto' },
            margins: { top: 90, bottom: 90, left: 160, right: 120 },
            children: [
              ...(lang ? [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: lang.toUpperCase(), font: FONT, size: 14, bold: true, color: '6B7A90' })] })] : []),
              ...lines.map((l) => new Paragraph({ spacing: { after: 0, line: 240 }, children: [new TextRun({ text: l.length ? l : ' ', font: MONO, size: 16, color: '1E2A38' })] })),
            ],
          }),
        ],
      }),
    ],
  });
}

// ---------- caixa de evidência (print) ----------
function callout(items) {
  const border = { style: BorderStyle.SINGLE, size: 6, color: 'C98A00' };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: CONTENT_W, type: WidthType.DXA },
            borders: { top: border, bottom: border, right: border, left: { style: BorderStyle.SINGLE, size: 24, color: 'C98A00' } },
            shading: { type: ShadingType.CLEAR, fill: 'FFF8E6', color: 'auto' },
            margins: { top: 100, bottom: 100, left: 180, right: 140 },
            children: [
              new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'EVIDÊNCIAS A ANEXAR', bold: true, size: 17, color: '8A5A00' })] }),
              ...items.map((t, i) =>
                new Paragraph({
                  spacing: { after: 40, line: 270 },
                  children: [new TextRun({ text: `Print ${i + 1}. `, bold: true, size: 18, color: '8A5A00' }), ...inline(t, { size: 18 })],
                }),
              ),
            ],
          }),
        ],
      }),
    ],
  });
}

function image(file, caption) {
  const png = fs.readFileSync(path.join(DIR, file));
  const w = png.readUInt32BE(16), h = png.readUInt32BE(20);
  const maxW = 640; // px a 96 dpi, largura útil
  let width = maxW, height = Math.round((h / w) * maxW);
  if (height > 500) { width = Math.round((500 / height) * width); height = 500; }
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, children: [new ImageRun({ type: 'png', data: png, transformation: { width, height }, altText: { title: caption, description: caption, name: file } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `Figura — ${caption}`, italics: true, size: 17, color: '5A6B80' })] }),
  ];
}

// ---------- parser do markdown ----------
const body = [];
const tocHeadings = []; // títulos de nível 1 e 2, na ordem em que aparecem
let numInstance = 0;
for (let i = 0; i < SRC.length; i++) {
  const line = SRC[i];
  if (!line.trim()) continue;

  if (line.trim() === '<<<PAGEBREAK>>>') { body.push(new Paragraph({ children: [new PageBreak()] })); continue; }

  const h = /^(#{1,3}) (.+)$/.exec(line);
  if (h) {
    const level = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][h[1].length - 1];
    if (h[1].length <= 2) tocHeadings.push({ title: h[2], level: h[1].length });
    body.push(new Paragraph({ heading: level, children: [new TextRun({ text: h[2] })] }));
    continue;
  }

  if (line.startsWith('```')) {
    const lang = line.slice(3).trim();
    const code = [];
    while (!SRC[++i].startsWith('```')) code.push(SRC[i]);
    body.push(codeBlock(code, lang));
    body.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    continue;
  }

  if (line.startsWith('|')) {
    const rows = [];
    while (i < SRC.length && SRC[i].startsWith('|')) rows.push(SRC[i++]);
    i--;
    body.push(table(rows));
    body.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    continue;
  }

  if (line.startsWith('> [PRINT]')) {
    const items = [];
    while (i < SRC.length && SRC[i].startsWith('> [PRINT]')) items.push(SRC[i++].replace('> [PRINT]', '').trim());
    i--;
    body.push(callout(items));
    body.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
    continue;
  }

  const img = /^!\[(.+)\]\((.+)\)$/.exec(line.trim());
  if (img) { body.push(...image(img[2], img[1])); continue; }

  if (/^- /.test(line)) {
    body.push(new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 80, line: 290 }, children: inline(line.slice(2)) }));
    continue;
  }

  if (/^\d+\. /.test(line)) {
    numInstance++;
    while (i < SRC.length && /^\d+\. /.test(SRC[i])) {
      body.push(new Paragraph({ numbering: { reference: 'numbers', level: 0, instance: numInstance }, spacing: { after: 80, line: 290 }, children: inline(SRC[i].replace(/^\d+\. /, '')) }));
      i++;
    }
    i--;
    continue;
  }

  body.push(para(line, { alignment: AlignmentType.JUSTIFIED }));
}

// ---------- capa e sumário ----------
// O sumário sai já preenchido (cachedEntries). Sem isso, o campo TOC fica vazio até alguém
// abrir no Word e mandar atualizar, e visualizadores nunca mostram nada.
const buildCover = (tocEntries) => [
  new Paragraph({ spacing: { before: 2400 }, children: [new TextRun({ text: 'CHALLENGE FORD 2026 · FIAP', size: 22, bold: true, color: '6B7A90', characterSpacing: 40 })] }),
  new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: 'Ford Intelligence', size: 64, bold: true, color: BLUE })] }),
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } }, spacing: { after: 360 }, children: [new TextRun({ text: 'Sprint 3 — Cybersecurity: modelo DevSecOps', size: 34, color: '2E4A6F' })] }),
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Pipeline DevSecOps · Segurança em código e infraestrutura · Observabilidade e resposta a incidentes · Compliance, riscos e segurança contínua', size: 21, color: '4A5A70' })] }),
  new Paragraph({ spacing: { before: 1600, after: 120 }, children: [new TextRun({ text: 'Integrantes', size: 22, bold: true, color: BLUE })] }),
  ...[1, 2, 3, 4, 5].map(() => new Paragraph({ spacing: { after: 100 }, tabStops: [{ type: TabStopType.LEFT, position: 6000 }], children: [new TextRun({ text: 'Nome: ______________________________\tRM: __________', size: 21, color: '4A5A70' })] })),
  new Paragraph({ spacing: { before: 600 }, children: [new TextRun({ text: 'Turma: __________      Entrega: 27/09/2026', size: 21, color: '4A5A70' })] }),
  new Paragraph({ children: [new PageBreak()] }),
  new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'Sumário', size: 32, bold: true, color: BLUE })] }),
  new TableOfContents('Sumário', { hyperlink: true, headingStyleRange: '1-2', cachedEntries: tocEntries, beginDirty: false }),
  new Paragraph({ children: [new PageBreak()] }),
];

const buildDoc = (tocEntries) => new Document({
  creator: 'Equipe Ford Intelligence',
  title: 'Ford Intelligence — Sprint 3 Cybersecurity',
  description: 'Entrega da Sprint 3 de Cybersecurity (DevSecOps)',
  features: { updateFields: false },
  styles: {
    default: { document: { run: { font: FONT, size: 21, color: '1E2A38' } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: BLUE, font: FONT }, paragraph: { spacing: { before: 240, after: 200 }, outlineLevel: 0, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: 'B8C4D4', space: 6 } } } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: '2E4A6F', font: FONT }, paragraph: { spacing: { before: 320, after: 140 }, outlineLevel: 1, keepNext: true } },
      { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', next: 'Normal', run: { bold: true, size: 21, color: BLUE }, paragraph: { spacing: { before: 140, after: 40 } } },
      { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', next: 'Normal', run: { size: 20 }, paragraph: { indent: { left: 360 }, spacing: { after: 30 } } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, color: '2E4A6F', font: FONT }, paragraph: { spacing: { before: 240, after: 100 }, outlineLevel: 2, keepNext: true } },
    ],
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      { reference: 'numbers', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 300 } } } }] },
    ],
  },
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } }, titlePage: true },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Ford Intelligence · Sprint 3 · Cybersecurity (DevSecOps)', size: 16, color: '7A889C' })] })] }),
        first: new Header({ children: [new Paragraph({ children: [] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], size: 17, color: '7A889C' })] })] }),
        first: new Footer({ children: [new Paragraph({ children: [] })] }),
      },
      children: [...buildCover(tocEntries), ...body],
    },
  ],
});

// ---------- geração ----------
// 1ª passada: sumário com todos os títulos e página provisória (mesmo tamanho do final).
// 2ª passada: renderiza em PDF com o LibreOffice, acha a página de cada título e gera de novo.
// Sem LibreOffice/pdftotext na máquina, o sumário sai com os títulos e sem números de página
// (no Word: clique com o botão direito no sumário > Atualizar campo).
const out = process.argv[2] || path.join(DIR, 'Sprint3-Cybersecurity-Ford-Intelligence.docx');

function findPages(docxPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'toc-'));
  try {
    const soffice = process.platform === 'win32' ? 'soffice.exe' : 'soffice';
    execFileSync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', tmp, docxPath], { stdio: 'ignore' });
    const pdf = path.join(tmp, path.basename(docxPath).replace(/\.docx$/, '.pdf'));
    const norm = (t) => t.replace(/\s+/g, ' ').trim();
    const pages = execFileSync('pdftotext', ['-layout', pdf, '-'], { encoding: 'utf8' }).split('\f').map(norm);
    // o próprio sumário também contém os títulos: começa a procurar depois dele
    let tocEnd = pages.findIndex((p, i) => i > 0 && !p.includes('Sumário') && p.includes(norm(tocHeadings[0].title)));
    if (tocEnd < 0) return null;
    let cursor = tocEnd;
    const found = [];
    for (const hd of tocHeadings) {
      const t = norm(hd.title);
      let i = cursor;
      while (i < pages.length && !pages[i].includes(t)) i++;
      if (i >= pages.length) return null;
      found.push(i + 1); // numeração do rodapé = posição física da página
      cursor = i;
    }
    return found;
  } catch {
    return null;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

(async () => {
  const draft = tocHeadings.map((h) => ({ ...h, page: 88 }));
  fs.writeFileSync(out, await Packer.toBuffer(buildDoc(draft)));
  const pages = findPages(out);
  const entries = tocHeadings.map((h, i) => ({ ...h, page: pages ? pages[i] : undefined }));
  fs.writeFileSync(out, await Packer.toBuffer(buildDoc(entries)));
  console.log('Gerado:', out, pages ? '(sumário com páginas)' : '(sumário sem números de página: atualize o campo no Word)');
})();
