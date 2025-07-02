// controllers/property.controller.js
const PropertyModel = require("../models/property.model");
const fs = require("fs");
const path = require("path");

// NO NECESITAS IMPORTAR 'db' AQUÍ DIRECTAMENTE.
// La conexión 'db' se obtendrá de 'req.db' que se adjunta en app.js.

// Controlador para subir una nueva propiedad (Este se llama DESPUÉS de Multer)
exports.createProperty = async (req, res) => {
  // Obtén la conexión a la base de datos desde el objeto de solicitud (req)
  const db = req.db;

  console.log("--- INICIO DE createProperty ---");
  console.log("req.body recibido:", req.body);
  console.log("req.files recibido:", req.files); // Esto te dirá si Multer está procesando los archivos

  // Desestructuración de los campos del cuerpo de la solicitud
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
    // Los campos 'ambiente' y 'servicio' vienen del frontend como arrays (si hay múltiples)
    // o como string (si es uno solo) o undefined (si no se seleccionó nada).
    // Los manejaremos a continuación.
    ambiente, // Nombre del campo en el HTML para ambientes
    servicio, // Nombre del campo en el HTML para servicios
  } = req.body;

  // Validación básica de campos requeridos
  if (!type || !price || !barrio || !city || !province) {
    console.error("Error: Campos requeridos faltantes.");
    // Eliminar archivos subidos si la validación falla
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          "properties",
          file.filename
        );
        fs.unlink(filePath, (err) => {
          if (err)
            console.error(`Error al borrar archivo fallido ${filePath}:`, err);
          else console.log(`Archivo fallido borrado: ${filePath}`);
        });
      });
    }
    return res.status(400).json({
      message:
        "Campos requeridos faltantes: tipo, precio, barrio, ciudad, provincia.",
    });
  }

  // Procesar las URLs de los archivos subidos por Multer
  const mediaUrls = req.files
    ? req.files.map((file) => `/uploads/properties/${file.filename}`)
    : [];
  console.log("URLs de media generadas:", mediaUrls);

  // Convertir 'ambiente' y 'servicio' a strings separados por comas,
  // ya que el modelo de la base de datos los espera así.
  // Si 'ambiente'/'servicio' es un array, lo une. Si es un string, lo usa directamente.
  // Si es undefined/null, usa un string vacío.
  const parsedAmbientes = Array.isArray(ambiente)
    ? ambiente.join(",")
    : ambiente || "";
  const parsedServices = Array.isArray(servicio)
    ? servicio.join(",")
    : servicio || "";
  console.log("Ambientes parseados (string):", parsedAmbientes);
  console.log("Servicios parseados (string):", parsedServices);

  try {
    // Obtener el userId. En un sistema real, esto vendría del usuario autenticado (ej. req.user.id).
    // Para pruebas, usamos un ID fijo (1). Asegúrate de que exista un usuario con ID 1 en tu tabla 'Users'.
    const userId = req.user ? req.user.id : 1;
    console.log("UserId a usar:", userId);

    // Preparar los datos de la propiedad para el modelo
    const propertyData = {
      type,
      price: parseFloat(price), // Convertir a número flotante
      barrio,
      streetType: streetType || null,
      city,
      province,
      zonificacion: zonificacion || null,
      condition: condition || null,
      situation: situation || null,
      antiquity: antiquity ? parseInt(antiquity) : null, // Convertir a entero
      surface: surface ? parseFloat(surface) : null, // Convertir a flotante
      coveredSurface: coveredSurface ? parseFloat(coveredSurface) : null, // Convertir a flotante
      urbanization: urbanization || null,
      security: security || null,
      description: description || null,
      ambientes: parsedAmbientes, // Ya es un string
      services: parsedServices, // Ya es un string
      mediaUrls: JSON.stringify(mediaUrls), // Convertir el array de URLs a un string JSON
      userId,
    };
    console.log("Datos finales de la propiedad a guardar:", propertyData);

    // Llamar al método 'create' del modelo de propiedad, pasándole la conexión 'db' y los datos
    const newPropertyId = await PropertyModel.create(db, propertyData);
    console.log("Propiedad insertada con ID:", newPropertyId);

    // Enviar respuesta de éxito al frontend
    res.status(201).json({
      message: "Propiedad subida exitosamente",
      propertyId: newPropertyId,
    });
  } catch (error) {
    console.error("--- ERROR EN createProperty (al guardar en DB) ---");
    console.error("Error al guardar la propiedad en la DB:", error);
    // Eliminar archivos subidos si falla la inserción en la DB
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          "properties",
          file.filename
        );
        fs.unlink(filePath, (err) => {
          if (err)
            console.error(`Error al borrar archivo fallido ${filePath}:`, err);
          else console.log(`Archivo fallido borrado: ${filePath}`);
        });
      });
    }
    // Enviar respuesta de error al frontend
    res
      .status(500)
      .json({
        message: "Error interno del servidor al subir la propiedad.",
        error: error.message,
      });
  }
  console.log("--- FIN DE createProperty ---");
};

// Controlador para obtener todas las propiedades
exports.getAllProperties = async (req, res) => {
  // Obtén la conexión a la base de datos desde el objeto de solicitud (req)
  const db = req.db;
  const filters = req.query; // Los parámetros de la URL son los filtros

  // Procesar filtros para ambientes si vienen como string separado por comas
  // El frontend envía 'ambienteFilter=valor1&ambienteFilter=valor2', req.query lo recibe como un array si hay múltiples.
  // Si viene como un solo valor, req.query lo recibe como string.
  if (filters.ambienteFilter) {
    // Asegurarse de que filters.ambienteFilter sea un array para poder iterar
    filters.ambientes = Array.isArray(filters.ambienteFilter)
      ? filters.ambienteFilter
      : [filters.ambienteFilter];
    delete filters.ambienteFilter; // Eliminar el original para no duplicar
  } else {
    filters.ambientes = []; // Asegurarse de que siempre sea un array vacío si no hay filtro
  }

  try {
    // Llamar al método 'findAll' del modelo de propiedad, pasándole la conexión 'db' y los filtros
    const properties = await PropertyModel.findAll(db, filters);
    res.status(200).json(properties);
  } catch (error) {
    console.error("Error al obtener propiedades:", error);
    res.status(500).json({
      message: "Error interno del servidor al obtener las propiedades.",
      error: error.message, // Añadir el mensaje de error para depuración
    });
  }
};

// Controlador para obtener una propiedad por ID
exports.getPropertyById = async (req, res) => {
  // Obtén la conexión a la base de datos desde el objeto de solicitud (req)
  const db = req.db;
  try {
    const { id } = req.params;
    // Llamar al método 'findById' del modelo de propiedad, pasándole la conexión 'db'
    const property = await PropertyModel.findById(db, id);
    if (!property) {
      return res.status(404).json({ message: "Propiedad no encontrada." });
    }
    res.status(200).json(property);
  } catch (error) {
    console.error("Error al obtener propiedad por ID:", error);
    res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

// Función para modificar una propiedad existente
exports.updateProperty = async (req, res) => {
  // Obtén la conexión a la base de datos desde el objeto de solicitud (req)
  const db = req.db;
  const { id } = req.params;
  const propertyData = req.body;
  let mediaUrls = [];

  // Si hay nuevos archivos, procesarlos
  if (req.files && req.files.length > 0) {
    mediaUrls = req.files.map((file) => `/uploads/properties/${file.filename}`);
  } else if (propertyData.mediaUrls) {
    // Si no se suben nuevos archivos, pero se envían URLs existentes desde el frontend (como string JSON)
    try {
      mediaUrls = JSON.parse(propertyData.mediaUrls);
    } catch (e) {
      console.error("Error parsing existing mediaUrls:", e);
      mediaUrls = [];
    }
  }

  // Convertir ambientes y servicios a string para la DB
  if (propertyData.ambientes) {
    propertyData.ambientes = Array.isArray(propertyData.ambientes)
      ? propertyData.ambientes.join(",")
      : propertyData.ambientes;
  }
  if (propertyData.services) {
    propertyData.services = Array.isArray(propertyData.services)
      ? propertyData.services.join(",")
      : propertyData.services;
  }

  try {
    // Llamar al método 'update' del modelo de propiedad, pasándole la conexión 'db'
    const result = await PropertyModel.update(db, id, {
      ...propertyData,
      mediaUrls: JSON.stringify(mediaUrls),
    });
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Propiedad no encontrada o no hubo cambios." });
    }
    res.status(200).json({ message: "Propiedad actualizada exitosamente." });
  } catch (error) {
    console.error("Error al actualizar la propiedad:", error);
    res.status(500).json({
      message: "Error interno del servidor al actualizar la propiedad.",
      error: error.message,
    });
  }
};

// Función para borrar una propiedad
exports.deleteProperty = async (req, res) => {
  // Obtén la conexión a la base de datos desde el objeto de solicitud (req)
  const db = req.db;
  const { id } = req.params;

  try {
    // Paso 1: Obtener la propiedad para saber qué imágenes borrar
    // Llamar al método 'findById' del modelo de propiedad, pasándole la conexión 'db'
    const property = await PropertyModel.findById(db, id);
    if (!property) {
      return res.status(404).json({ message: "Propiedad no encontrada." });
    }

    // Paso 2: Borrar la propiedad de la base de datos
    // Llamar al método 'delete' del modelo de propiedad, pasándole la conexión 'db'
    const result = await PropertyModel.delete(db, id);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Propiedad no encontrada o ya ha sido eliminada." });
    }

    // Paso 3 (Opcional pero recomendado): Borrar los archivos de imagen asociados
    if (property.mediaUrls && property.mediaUrls.length > 0) {
      const parsedMediaUrls = JSON.parse(property.mediaUrls);
      parsedMediaUrls.forEach((url) => {
        const filePath = path.join(__dirname, "..", url);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Error al borrar el archivo ${filePath}:`, err);
          } else {
            console.log(`Archivo borrado: ${filePath}`);
          }
        });
      });
    }

    res.status(200).json({ message: "Propiedad eliminada exitosamente." });
  } catch (error) {
    console.error("Error al borrar la propiedad:", error);
    res.status(500).json({
      message: "Error interno del servidor al borrar la propiedad.",
      error: error.message,
    });
  }
};
