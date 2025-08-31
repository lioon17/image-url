const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Set up dynamic storage per bucket
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const bucket = req.body.bucket;
    const dir = `uploads/${bucket}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  const { bucket } = req.body;
  const file = req.file;
  const url = `http://localhost:5000/images/${bucket}/${file.filename}`;
  res.json({ success: true, url });
});

module.exports = router;
