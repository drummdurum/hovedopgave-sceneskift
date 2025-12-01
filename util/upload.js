const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Sørg for at uploads mappen eksisterer
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfigurer storage for billede uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Opret undermappe baseret på brugerens teater (slug-format)
    const teaternavn = req.session?.user?.teaternavn || 'ukendt';
    const teaterSlug = teaternavn
      .toLowerCase()
      .replace(/æ/g, 'ae')
      .replace(/ø/g, 'oe')
      .replace(/å/g, 'aa')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const teaterDir = path.join(uploadsDir, teaterSlug);
    
    // Opret mappen hvis den ikke eksisterer
    if (!fs.existsSync(teaterDir)) {
      fs.mkdirSync(teaterDir, { recursive: true });
    }
    
    cb(null, teaterDir);
  },
  filename: function (req, file, cb) {
    // Generer et unikt filnavn med timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'produkt-' + uniqueSuffix + ext);
  }
});

// Filtrer kun billede filer
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Kun billede filer er tilladt (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // Maks 5MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
