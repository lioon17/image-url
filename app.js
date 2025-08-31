const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'uploads')));

// Set up Multer for dynamic destination
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const bucket = req.body.bucket;
    const dir = path.join(__dirname, 'uploads', bucket);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });  // ✅ Create folder if it doesn't exist
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  const bucket = req.body.bucket;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No image uploaded' });
  }

  const publicUrl = `http://localhost:${PORT}/images/${bucket}/${file.filename}`;
  res.json({ success: true, url: publicUrl });
});
 
// Fallback
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Meena backend running at http://localhost:${PORT}`);
});
