CREATE TABLE IF NOT EXISTS contests (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  orgao TEXT,
  uf TEXT NOT NULL,
  municipio TEXT,
  abrangencia TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'iminente',
  vagas TEXT,
  escolaridade TEXT,
  banca TEXT,
  inicio TEXT,
  fim TEXT,
  prova TEXT,
  fonte TEXT,
  oficial INTEGER NOT NULL DEFAULT 0,
  origem TEXT,
  confidence TEXT,
  updated TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contest_id TEXT,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  scope TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  last_checked TEXT
);
CREATE INDEX IF NOT EXISTS idx_contests_uf ON contests(uf);
CREATE INDEX IF NOT EXISTS idx_contests_status ON contests(status);
CREATE INDEX IF NOT EXISTS idx_contests_updated ON contests(updated_at);
