-- Seed kategorier for rekvisitter
INSERT INTO "Kategorier" (navn) VALUES
  ('Møbler'),
  ('Belysning'),
  ('Rekvisitter'),
  ('Sceneteknik'),
  ('Lyd & Musik'),
  ('Dekor & Baggrund'),
  ('Håndrekvisitter'),
  ('Køkkengrej'),
  ('Våben & Rustninger'),
  ('Bøger & Dokumenter'),
  ('Kunst & Malerier'),
  ('Planteudstyr'),
  ('Vintage & Antik'),
  ('Moderne'),
  ('Historisk'),
  ('Fantasy & Sci-Fi'),
  ('Børneforestillinger'),
  ('Sport & Fritid'),
  ('Elektronik & Teknologi')
ON CONFLICT (navn) DO NOTHING;
