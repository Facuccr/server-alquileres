// controllers/property.controller.js
const PropertyModel = require("../models/property.model"); // Asegúrate de que la ruta sea correcta
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Para manejar archivos del sistema

// Configuración de Multer para la carga de archivos
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
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi|wmv/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        "Error: Solo se permiten imágenes (jpeg, jpg, png, gif) y videos (mp4, mov, avi, wmv)!"
      );
    }
  },
}).array("media", 10); // 'media' es el nombre del input de archivo en el HTML, permite hasta 10 archivos

// Controlador para subir una nueva propiedad
exports.uploadProperty = (req, res) => {
  const db = req.db; // Obtiene la conexión de la solicitud

  upload(req, res, async (err) => {
    if (err) {
      console.error("Error al subir archivos:", err);
      return res
        .status(400)
        .json({ message: err.message || "Error al subir archivos." });
    }

    // Validación de campos
    const {
      type,
      price,
      barrio,
      streetType,
      city,
      province,
      zonificacion,
      condition,
      situation,
      antiquity,
      surface,
      coveredSurface,
      urbanization,
      security,
      description,
      ambiente,
      servicio, // Nota: 'ambiente' y 'servicio' son los nombres del HTML
    } = req.body;

    if (!type || !price || !barrio || !city || !province) {
      // Eliminar archivos subidos si la validación falla
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
      }
      return res
        .status(400)
        .json({
          message:
            "Campos requeridos faltantes: tipo, precio, barrio, ciudad, provincia.",
        });
    }

    // Procesar las URLs de los archivos subidos
    const mediaUrls = req.files
      ? req.files.map((file) => `/uploads/properties/${file.filename}`)
      : [];

    // Asegurarse de que 'ambiente' y 'servicio' sean arrays, incluso si solo viene un valor o ninguno
    const parsedAmbientes = Array.isArray(ambiente)
      ? ambiente
      : ambiente
      ? [ambiente]
      : [];
    const parsedServices = Array.isArray(servicio)
      ? servicio
      : servicio
      ? [servicio]
      : [];

    try {
      // Aquí deberías obtener el userId del usuario autenticado.
      // Por ahora, para pruebas, usaremos un ID fijo (ej. 1).
      // En un sistema real, esto vendría de un token JWT o sesión (ej: req.user.id).
      const userId = 1; // ID de usuario fijo para pruebas. ¡CAMBIA ESTO EN PRODUCCIÓN!

      const propertyData = {
        type,
        price: parseFloat(price),
        barrio,
        streetType: streetType || null,
        city,
        province,
        zonificacion: zonificacion || null,
        condition: condition || null,
        situation: situation || null,
        antiquity: antiquity ? parseInt(antiquity) : null,
        surface: surface ? parseFloat(surface) : null,
        coveredSurface: coveredSurface ? parseFloat(coveredSurface) : null,
        urbanization: urbanization || null,
        security: security || null,
        description: description || null,
        ambientes: parsedAmbientes,
        services: parsedServices,
        mediaUrls: mediaUrls,
        userId,
      };

      const newPropertyId = await PropertyModel.create(db, propertyData);

      res
        .status(201)
        .json({
          message: "Propiedad subida exitosamente",
          propertyId: newPropertyId,
        });
    } catch (error) {
      console.error("Error al guardar la propiedad en la DB:", error);
      // Eliminar archivos subidos si falla la inserción en la DB
      if (req.files && req.files.length > 0) {
        req.files.forEach((file) => fs.unlinkSync(file.path));
      }
      res
        .status(500)
        .json({
          message: "Error interno del servidor al subir la propiedad.",
          error: error.message,
        });
    }
  });
};

// Controlador para obtener todas las propiedades
exports.getAllProperties = async (req, res) => {
  const db = req.db; // Obtiene la conexión de la solicitud
  const filters = req.query; // Los parámetros de la URL son los filtros

  // Procesar filtros para ambientes si vienen como string separado por comas
  if (filters.ambienteFilter) {
    filters.ambientes = filters.ambienteFilter.split(",");
    delete filters.ambienteFilter; // Eliminar el original para no duplicar
  }

  try {
    const properties = await PropertyModel.findAll(db, filters);
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error al obtener propiedades:", error);
    res
      .status(500)
      .json({
        message: "Error interno del servidor al obtener las propiedades.",
      });
  }
};

// Controlador para obtener una propiedad por ID (opcional por ahora)
exports.getPropertyById = async (req, res) => {
  const db = req.db; // Obtiene la conexión de la solicitud
  try {
    const { id } = req.params;
    const property = await PropertyModel.findById(db, id);
    if (!property) {
      return res.status(404).json({ message: "Propiedad no encontrada." });
    }
    res.status(200).json(property);
  } catch (error) {
    console.error("Error al obtener propiedad por ID:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
