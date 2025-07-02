// routes/property.route.js
const express = require("express");
const router = express.Router();
const propertyController = require("../controllers/property.controller");

// Ruta para subir una nueva propiedad (POST)
router.post("/properties", propertyController.uploadProperty);

// Ruta para obtener todas las propiedades (GET)
router.get("/properties", propertyController.getAllProperties);

// Ruta para obtener una propiedad específica por ID (GET)
router.get("/properties/:id", propertyController.getPropertyById);

module.exports = router;
