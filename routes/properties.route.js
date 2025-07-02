// routes/properties.route.js
const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/property.controller");
const upload = require("../config/multer"); // Importa el middleware de Multer

// Ruta para subir una nueva propiedad (POST)
router.post("/", upload.array("media", 10), propertyController.createProperty); // Usa createProperty

// Ruta para obtener todas las propiedades y aplicar filtros (GET)
router.get("/", propertyController.getAllProperties);

// Ruta para obtener una propiedad por ID (GET)
router.get("/:id", propertyController.getPropertyById);

// Ruta para MODIFICAR una propiedad por ID (PUT/PATCH)
router.put(
  "/:id",
  upload.array("media", 10),
  propertyController.updateProperty
);
router.patch(
  "/:id",
  upload.array("media", 10),
  propertyController.updateProperty
);

// Ruta para BORRAR una propiedad por ID (DELETE)
router.delete("/:id", propertyController.deleteProperty);

module.exports = router;
