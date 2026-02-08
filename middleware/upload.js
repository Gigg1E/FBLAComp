const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'public', 'uploads', 'businesses');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Temporary storage (before processing)
const storage = multer.memoryStorage();

// File filter for validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and GIF images are allowed.'), false);
    }
};

// Create multer instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});

// Middleware to process uploaded image with Sharp
const processImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 15);
        const filename = uniqueSuffix + '.jpg';
        const outputPath = path.join(uploadDir, filename);

        // Process image with Sharp
        await sharp(req.file.buffer)
            .resize(1200, 800, {
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({
                quality: 85,
                mozjpeg: true
            })
            .toFile(outputPath);

        // Add processed file info to request
        req.processedFile = {
            filename: filename,
            path: `/uploads/businesses/${filename}`,
            size: fs.statSync(outputPath).size
        };

        next();
    } catch (error) {
        console.error('Error processing image:', error);
        next(new Error('Failed to process image'));
    }
};

// Export upload middleware with image processing
module.exports = {
    upload: upload.single('business_image'),
    processImage
};
