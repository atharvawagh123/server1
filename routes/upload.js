const router = require('express').Router();
const cloudinary = require('cloudinary').v2; // Ensure using cloudinary's v2 API
const auth = require('../middleware/auth');
const authAdmin = require('../middleware/authAdmin');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save files temporarily
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 }, // 1MB file size limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// Function to remove temporary files
const removeTmp = (filePath) => {
    fs.unlink(filePath, err => {
        if (err) throw err;
    });
};
    
// Upload route
router.post('/upload', auth, authAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: "No file was uploaded" });
        }

        const filePath = req.file.path;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            folder: 'test'
        });

        // Remove the temporary file
        removeTmp(filePath);

        // Respond with the uploaded image's details
        res.json({
            public_id: result.public_id,
            url: result.secure_url
        });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
});

// Delete route
router.post('/destroy', auth, authAdmin, async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) return res.status(400).json({ msg: "No image selected" });

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(public_id);

        res.json({ msg: "Deleted" });
    } catch (err) {
        return res.status(500).json({ msg: err.message });
    }
});

module.exports = router;
