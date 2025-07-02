// config/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Define el directorio de destino para las cargas
const uploadDir = path.join(__dirname, "../uploads/properties");

// Asegúrate de que el directorio de carga exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Genera un nombre de archivo único para evitar colisiones
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Limite de 20MB por archivo (ajusta si es necesario)
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes y videos
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|wmv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Error: Solo se permiten imágenes (jpeg, jpg, png, gif) y videos (mp4, mov, avi, wmv)!"
        )
      );
    }
  },
});

module.exports = upload;
