const express = require('express');
const cors = require('cors');
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDir),
  filename: (req, file, callback) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, unique + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedExtensions = /\.(jpeg|jpg|png|webp|mp4|mov|avi)$/i;
    const allowedMimeTypes = /^(image\/(jpeg|png|webp)|video\/(mp4|quicktime|x-msvideo))$/i;
    if (allowedExtensions.test(file.originalname) && allowedMimeTypes.test(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Only JPEG, PNG, WebP images and MP4, MOV, AVI videos are allowed'));
    }
  }
});

// Allow the Vite dev server origin so the React client can call the API
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

const DB_PATH = path.join(__dirname, 'gramsahayak.db');
const db = new DatabaseSync(DB_PATH);

// Initialize schema
db.prepare(`CREATE TABLE IF NOT EXISTS villages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  block TEXT,
  district TEXT,
  population INTEGER
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  village_id INTEGER NOT NULL,
  category TEXT,
  description TEXT,
  severity TEXT,
  status TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(village_id) REFERENCES villages(id)
)`).run();

db.exec(`
  CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    eligibility TEXT,
    documents TEXT,
    how_to_apply TEXT,
    official_link TEXT,
    helpline TEXT,
    local_contact_role TEXT
  );
  CREATE TABLE IF NOT EXISTS grievances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    issue TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    media_path TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

for (const column of ['category TEXT DEFAULT \'other\'', 'media_path TEXT']) {
  try {
    db.exec(`ALTER TABLE grievances ADD COLUMN ${column}`);
  } catch (error) {
    if (!String(error.message).toLowerCase().includes('duplicate column')) throw error;
  }
}

for (const column of ['eligibility TEXT', 'documents TEXT', 'how_to_apply TEXT', 'official_link TEXT', 'helpline TEXT', 'local_contact_role TEXT']) {
  try {
    db.exec(`ALTER TABLE schemes ADD COLUMN ${column}`);
  } catch (error) {
    if (!String(error.message).toLowerCase().includes('duplicate column')) throw error;
  }
}

const schemeCount = db.prepare('SELECT COUNT(*) AS count FROM schemes').get();
const schemes = [
  {
    name: 'PM-Kisan Samman Nidhi',
    category: 'agriculture',
    description: 'INR 6,000 per year in income support for small and marginal farmers, paid in three installments.',
    eligibility: 'All landholding farmer families with cultivable land, subject to exclusion criteria such as income tax payers and government employees.',
    documents: 'Aadhaar card, land ownership papers, bank account details, mobile number',
    how_to_apply: 'Register at the nearest Common Service Centre (CSC) or online at pmkisan.gov.in. A local patwari or panchayat can assist with land verification.',
    official_link: 'https://pmkisan.gov.in',
    helpline: '155261 / 1800-115-526',
    local_contact_role: 'Village Agriculture Extension Officer or CSC operator'
  },
  {
    name: 'Ayushman Bharat (PM-JAY)',
    category: 'health',
    description: 'Free health insurance cover up to INR 5 lakh per family per year for secondary and tertiary care.',
    eligibility: 'Families identified under the SECC 2011 database as economically vulnerable; check eligibility through the portal or a CSC.',
    documents: 'Aadhaar card, ration card, mobile number',
    how_to_apply: 'Check eligibility at pmjay.gov.in or call 14555. Visit a nearby empanelled hospital or CSC to get an Ayushman card.',
    official_link: 'https://pmjay.gov.in',
    helpline: '14555 / 1800-111-565',
    local_contact_role: 'Ayushman Mitra at nearest empanelled hospital or CSC'
  },
  {
    name: 'MGNREGA',
    category: 'employment',
    description: 'Guarantees 100 days of wage employment per year to rural households.',
    eligibility: 'Any adult member of a rural household willing to do unskilled manual work.',
    documents: 'Aadhaar card, job card issued by the Gram Panchayat, bank account',
    how_to_apply: 'Apply for a Job Card at the Gram Panchayat office. Once issued, request work in writing; the panchayat must provide work within 15 days.',
    official_link: 'https://nrega.nic.in',
    helpline: '1800-111-555',
    local_contact_role: 'Gram Rozgar Sevak or Panchayat Secretary'
  },
  {
    name: 'Pradhan Mantri Awas Yojana (Gramin)',
    category: 'housing',
    description: 'Financial assistance for construction of pucca houses for rural poor.',
    eligibility: 'Houseless families or those living in kutcha or dilapidated houses, as identified through SECC 2011 and Awaas+ survey data.',
    documents: 'Aadhaar card, MGNREGA job card if available, bank account, land documents',
    how_to_apply: 'Contact the Gram Panchayat or Block Development Officer to check the beneficiary list, or apply through the Awaas+ mobile app.',
    official_link: 'https://pmayg.nic.in',
    helpline: '1800-11-6446',
    local_contact_role: 'Block Development Officer (BDO) or Panchayat Secretary'
  },
  {
    name: 'Pradhan Mantri Fasal Bima Yojana',
    category: 'agriculture',
    description: 'Crop insurance protecting farmers against crop loss or damage.',
    eligibility: 'All farmers growing notified crops in notified areas, including loanee and non-loanee farmers.',
    documents: 'Aadhaar card, land records, bank account, sowing certificate',
    how_to_apply: 'Apply through your bank if you have a crop loan, or through a CSC or insurance company portal before the seasonal enrollment deadline.',
    official_link: 'https://pmfby.gov.in',
    helpline: '1800-180-1551',
    local_contact_role: 'Bank branch manager or Village Agriculture Extension Officer'
  },
  {
    name: 'National Social Assistance Programme',
    category: 'welfare',
    description: 'Pension support for elderly people, widows, and people with disabilities below the poverty line.',
    eligibility: 'BPL households; age 60+ for elderly pension, widows of any age, and persons with 80% or more disability.',
    documents: 'Aadhaar card, age or disability proof, BPL certificate, bank account',
    how_to_apply: 'Apply at the Gram Panchayat or Block office with the required documents; forms are also available through the Social Welfare Department.',
    official_link: 'https://nsap.nic.in',
    helpline: '1800-11-0001',
    local_contact_role: 'Social Welfare Officer at Block office'
  },
  {
    name: 'Pradhan Mantri Ujjwala Yojana',
    category: 'welfare',
    description: 'Free LPG connections to women from BPL households.',
    eligibility: 'Adult women from BPL households without an existing LPG connection.',
    documents: 'Aadhaar card, BPL ration card, bank account, passport-size photo',
    how_to_apply: 'Visit the nearest LPG distributor with the required documents, or apply online at pmuy.gov.in.',
    official_link: 'https://pmuy.gov.in',
    helpline: '1800-266-6696',
    local_contact_role: 'Nearest LPG gas agency distributor'
  },
  {
    name: 'Jal Jeevan Mission',
    category: 'infrastructure',
    description: 'Aims to provide functional household tap water connections to rural households.',
    eligibility: 'All rural households without a functional tap water connection.',
    documents: 'No individual application is typically needed because implementation is village-wise; contact the Gram Panchayat for status.',
    how_to_apply: 'Check with the Gram Panchayat or Village Water and Sanitation Committee (VWSC) about implementation status in your village.',
    official_link: 'https://jaljeevanmission.gov.in',
    helpline: '1916 (toll-free water helpline, where active)',
    local_contact_role: 'Village Water and Sanitation Committee (VWSC) member'
  }
];

const updateScheme = db.prepare(`
  UPDATE schemes
  SET category = ?, description = ?, eligibility = ?, documents = ?, how_to_apply = ?, official_link = ?, helpline = ?, local_contact_role = ?
  WHERE name = ?
`);
const insertScheme = db.prepare(`
  INSERT INTO schemes (name, category, description, eligibility, documents, how_to_apply, official_link, helpline, local_contact_role)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
for (const scheme of schemes) {
  const result = updateScheme.run(scheme.category, scheme.description, scheme.eligibility, scheme.documents, scheme.how_to_apply, scheme.official_link, scheme.helpline, scheme.local_contact_role, scheme.name);
  if (result.changes === 0) {
    insertScheme.run(scheme.name, scheme.category, scheme.description, scheme.eligibility, scheme.documents, scheme.how_to_apply, scheme.official_link, scheme.helpline, scheme.local_contact_role);
  }
}
if (schemeCount.count === 0) {
  console.log(`Seeded schemes table with ${schemes.length} sample entries.`);
}

// Seed villages if empty
const row = db.prepare('SELECT COUNT(1) as cnt FROM villages').get();
if (!row || row.cnt === 0) {
  const insert = db.prepare('INSERT INTO villages (name, block, district, population) VALUES (?, ?, ?, ?)');
  const sample = [
    ['Bundu', 'Bundu', 'Ranchi', 15000],
    ['Khunti', 'Khunti', 'Khunti', 12000],
    ['Gumla', 'Gumla', 'Gumla', 18000],
    ['Simdega', 'Simdega', 'Simdega', 14000],
    ['Chaibasa', 'Chaibasa', 'West Singhbhum', 22000]
  ];
  db.exec('BEGIN');
  try {
    for (const r of sample) insert.run(r[0], r[1], r[2], r[3]);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  console.log('Seeded villages table with sample data.');
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/villages', (req, res) => {
  try {
    const villages = db.prepare('SELECT * FROM villages ORDER BY id').all();
    res.json({ data: villages });
  } catch (err) {
    console.error('Failed to fetch villages', err);
    res.status(500).json({ error: 'failed to fetch villages' });
  }
});

app.get('/api/schemes', (req, res) => {
  try {
    const category = String(req.query.category || '').trim();
    const rows = category
      ? db.prepare('SELECT * FROM schemes WHERE category = ? ORDER BY name').all(category)
      : db.prepare('SELECT * FROM schemes ORDER BY name').all();
    res.json({ data: rows });
  } catch (err) {
    console.error('Failed to fetch schemes', err);
    res.status(500).json({ error: 'failed to fetch schemes' });
  }
});

app.get('/api/assistant/query', (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  if (!query) return res.status(400).json({ error: 'Missing query' });

  const stopWords = new Set(['a', 'about', 'am', 'and', 'can', 'for', 'get', 'help', 'i', 'in', 'me', 'my', 'of', 'on', 'the', 'what', 'with']);
  const words = query.split(/\s+/).filter((word) => word && !stopWords.has(word));
  const schemes = db.prepare('SELECT * FROM schemes').all();
  const matches = schemes
    .map((scheme) => {
      const text = `${scheme.name} ${scheme.category} ${scheme.description}`.toLowerCase();
      const score = words.reduce((total, word) => total + (text.includes(word) ? 1 : 0), 0);
      return { ...scheme, score };
    })
    .filter((scheme) => scheme.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  if (matches.length === 0) {
    return res.json({
      answer: "I couldn't find a matching scheme. Try asking about farming, health, housing, or employment support.",
      matches: []
    });
  }

  const topMatch = matches[0];
  res.json({
    answer: `Based on your query, "${topMatch.name}" may help: ${topMatch.description} To apply: ${topMatch.how_to_apply} Contact: ${topMatch.helpline}. Locally, ask the ${topMatch.local_contact_role}.`,
    matches: matches.slice(0, 3).map(({ score, ...scheme }) => scheme)
  });
});

app.get('/api/grievances', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM grievances ORDER BY created_at DESC, id DESC').all();
    res.json({ data: rows });
  } catch (err) {
    console.error('Failed to fetch grievances', err);
    res.status(500).json({ error: 'failed to fetch grievances' });
  }
});

app.post('/api/grievances', upload.single('media'), (req, res) => {
  try {
    const { name, issue, category } = req.body || {};
    if (!name || !String(name).trim() || !issue || !String(issue).trim()) {
      return res.status(400).json({ error: 'name and issue are required' });
    }

    const mediaPath = req.file ? `/uploads/${req.file.filename}` : null;
    const result = db.prepare('INSERT INTO grievances (name, issue, category, media_path) VALUES (?, ?, ?, ?)').run(
      String(name).trim(),
      String(issue).trim(),
      String(category || 'other').trim() || 'other',
      mediaPath
    );
    const created = db.prepare('SELECT * FROM grievances WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: created });
  } catch (err) {
    console.error('Failed to create grievance', err);
    res.status(500).json({ error: 'failed to create grievance' });
  }
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError || error.message?.startsWith('Only JPEG')) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

// Create a new alert
app.post('/api/alerts', (req, res) => {
  try {
    const { village_id, category, description } = req.body || {};
    let { severity } = req.body || {};

    const errors = {}

    // village_id must be present and exist
    if (!village_id) errors.village_id = 'village_id is required'
    else {
      const village = db.prepare('SELECT id FROM villages WHERE id = ?').get(village_id);
      if (!village) errors.village_id = 'village_id does not exist'
    }

    // category validation
    const allowedCategories = ['water', 'health', 'crop', 'road', 'other']
    if (!category) errors.category = 'category is required'
    else if (!allowedCategories.includes(category)) errors.category = `category must be one of: ${allowedCategories.join(', ')}`

    // description validation
    if (!description || String(description).trim().length < 10) errors.description = 'description must be at least 10 characters'

    // severity default and validation
    if (!severity) severity = 'medium'
    const allowedSeverities = ['low', 'medium', 'high', 'critical']
    if (!allowedSeverities.includes(severity)) errors.severity = `severity must be one of: ${allowedSeverities.join(', ')}`

    if (Object.keys(errors).length) {
      return res.status(400).json({ error: 'validation_failed', errors })
    }

    const stmt = db.prepare('INSERT INTO alerts (village_id, category, description, severity, status) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(village_id, category, description, severity, 'pending');

    const created = db.prepare('SELECT a.*, v.name as village_name FROM alerts a JOIN villages v ON a.village_id = v.id WHERE a.id = ?').get(result.lastInsertRowid);
    res.status(201).json({ data: created });
  } catch (err) {
    console.error('Failed to create alert', err);
    res.status(500).json({ error: 'failed to create alert' });
  }
});

// List alerts joined with village name
app.get('/api/alerts', (req, res) => {
  try {
    const rows = db.prepare('SELECT a.id, a.village_id, v.name as village_name, a.category, a.description, a.severity, a.status, a.created_at FROM alerts a JOIN villages v ON a.village_id = v.id ORDER BY a.created_at DESC').all();
    res.json({ data: rows });
  } catch (err) {
    console.error('Failed to fetch alerts', err);
    res.status(500).json({ error: 'failed to fetch alerts' });
  }
});

// Update alert status
app.patch('/api/alerts/:id', (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body || {}
    const allowed = ['pending', 'in-progress', 'resolved']
    if (!allowed.includes(status)) return res.status(400).json({ error: 'invalid status' })

    const stmt = db.prepare('UPDATE alerts SET status = ? WHERE id = ?')
    const info = stmt.run(status, id)
    if (info.changes === 0) return res.status(404).json({ error: 'alert not found' })

    const updated = db.prepare('SELECT a.id, a.village_id, v.name as village_name, a.category, a.description, a.severity, a.status, a.created_at FROM alerts a JOIN villages v ON a.village_id = v.id WHERE a.id = ?').get(id)
    res.json({ data: updated })
  } catch (err) {
    console.error('Failed to update alert', err)
    res.status(500).json({ error: 'failed to update alert' })
  }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
