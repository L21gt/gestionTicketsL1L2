require("dotenv").config();
const cors = require("cors");
const express = require("express");
const authRoutes = require("./Soporte.API/Routes/authRoutes"); // Mueve tus rutas de auth aquí también
const ticketRoutes = require("./Soporte.API/Routes/ticketRoutes");
const catalogRoutes = require("./Soporte.API/Routes/catalogRoutes");

const app = express();
app.use(express.json());

// Configuración de CORS para permitir solicitudes desde el frontend
app.use(cors());

// Registro de Rutas en la Capa API
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

// Rutas para catálogos (productos)
app.use("/api/catalogs", catalogRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `🚀 Servidor en Arquitectura de 4 Capas corriendo en el puerto ${PORT}`,
  );
});
