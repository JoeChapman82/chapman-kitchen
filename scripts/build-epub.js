const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const plannersDir = path.join(__dirname, '..', 'data', 'planners');
const outputFile = path.join(__dirname, '..', 'planner.epub');

const index = JSON.parse(fs.readFileSync(path.join(plannersDir, 'index.json'), 'utf-8'));
const weeks = index.map(file => {
  const content = JSON.parse(fs.readFileSync(path.join(plannersDir, file), 'utf-8'));
  return { file, data: content };
});

const slots = ['breakfast', 'morning-snack', 'lunch', 'afternoon-snack', 'dinner'];
const slotLabels = ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner'];
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Generate XHTML for a single week
function generateWeekXhtml(week) {
  const weekNum = week.data.week || '?';
  let rows = '';
  days.forEach((day, i) => {
    const dayData = week.data.days[day] || {};
    let cells = '';
    slots.forEach(slot => {
      const info = dayData[slot] || {};
      const meal = info.meal ? info.meal.join(', ') : '';
      cells += '        <td>' + escapeXml(meal) + '</td>\n';
    });
    rows += '      <tr>\n        <th class="day">' + dayLabels[i] + '</th>\n' + cells + '      </tr>\n';
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Week ${weekNum}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h1>Week ${weekNum}</h1>
  <table>
    <thead>
      <tr>
        <th></th>
${slotLabels.map(s => '        <th>' + s + '</th>').join('\n')}
      </tr>
    </thead>
    <tbody>
${rows}    </tbody>
  </table>
</body>
</html>`;
}

// CSS for the EPUB
const css = `body {
  font-family: sans-serif;
  margin: 1em;
}
h1 {
  color: #993d1f;
  margin-bottom: 0.5em;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5em;
}
th, td {
  border: 1px solid #b89a80;
  padding: 0.4em 0.6em;
  text-align: center;
  font-size: 0.9em;
}
thead th {
  background: #f0e4d7;
  color: #993d1f;
}
.day {
  background: #f0e4d7;
  color: #993d1f;
  font-weight: bold;
}
td:empty::after {
  content: "\\2014";
  color: #ccc;
}
`;

// EPUB metadata files
const mimetype = 'application/epub+zip';

const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

function generateOpf(weeks) {
  const items = weeks.map((w, i) =>
    `    <item id="week${i + 1}" href="week${i + 1}.xhtml" media-type="application/xhtml+xml"/>`
  ).join('\n');
  const spine = weeks.map((w, i) =>
    `    <itemref idref="week${i + 1}"/>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="uid">weekly-planner-epub</dc:identifier>
    <dc:title>Weekly Planner</dc:title>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().split('.')[0] + 'Z'}</meta>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="nav" href="nav.xhtml" properties="nav" media-type="application/xhtml+xml"/>
${items}
  </manifest>
  <spine>
    <itemref idref="nav"/>
${spine}
  </spine>
</package>`;
}

function generateNav(weeks) {
  const links = weeks.map((w, i) =>
    `        <li><a href="week${i + 1}.xhtml">Week ${w.data.week || i + 1}</a></li>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc">
    <h1>Chapman kitchen</h1>
    <ol>
${links}
    </ol>
  </nav>
</body>
</html>`;
}

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ZIP file construction (no dependencies)
function createZip(files) {
  const entries = [];
  const centralDir = [];
  let offset = 0;

  for (const { name, content, compress } of files) {
    const data = Buffer.from(content, 'utf-8');
    const compressed = compress ? zlib.deflateRawSync(data) : data;
    const method = compress ? 8 : 0;
    const crc = crc32(data);

    // Local file header
    const nameBuffer = Buffer.from(name, 'utf-8');
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(method, 8); // compression
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc32
    localHeader.writeUInt32LE(compressed.length, 18); // compressed size
    localHeader.writeUInt32LE(data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // name length
    localHeader.writeUInt16LE(0, 28); // extra length

    const entry = Buffer.concat([localHeader, nameBuffer, compressed]);
    entries.push(entry);

    // Central directory entry
    const centralEntry = Buffer.alloc(46);
    centralEntry.writeUInt32LE(0x02014b50, 0);
    centralEntry.writeUInt16LE(20, 4);
    centralEntry.writeUInt16LE(20, 6);
    centralEntry.writeUInt16LE(0, 8);
    centralEntry.writeUInt16LE(method, 10);
    centralEntry.writeUInt16LE(0, 12);
    centralEntry.writeUInt16LE(0, 14);
    centralEntry.writeUInt32LE(crc, 16);
    centralEntry.writeUInt32LE(compressed.length, 20);
    centralEntry.writeUInt32LE(data.length, 24);
    centralEntry.writeUInt16LE(nameBuffer.length, 28);
    centralEntry.writeUInt16LE(0, 30);
    centralEntry.writeUInt16LE(0, 32);
    centralEntry.writeUInt16LE(0, 34);
    centralEntry.writeUInt16LE(0, 36);
    centralEntry.writeUInt32LE(0, 38);
    centralEntry.writeUInt32LE(offset, 42);
    centralDir.push(Buffer.concat([centralEntry, nameBuffer]));

    offset += entry.length;
  }

  const centralDirBuffer = Buffer.concat(centralDir);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(files.length, 8);
  endRecord.writeUInt16LE(files.length, 10);
  endRecord.writeUInt32LE(centralDirBuffer.length, 12);
  endRecord.writeUInt32LE(offset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...entries, centralDirBuffer, endRecord]);
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Build the EPUB
const files = [
  { name: 'mimetype', content: mimetype, compress: false },
  { name: 'META-INF/container.xml', content: container, compress: true },
  { name: 'OEBPS/content.opf', content: generateOpf(weeks), compress: true },
  { name: 'OEBPS/nav.xhtml', content: generateNav(weeks), compress: true },
  { name: 'OEBPS/style.css', content: css, compress: true },
];

weeks.forEach((week, i) => {
  files.push({
    name: 'OEBPS/week' + (i + 1) + '.xhtml',
    content: generateWeekXhtml(week),
    compress: true
  });
});

const epub = createZip(files);
fs.writeFileSync(outputFile, epub);
console.log('Built EPUB: ' + weeks.length + ' weeks -> ' + outputFile);