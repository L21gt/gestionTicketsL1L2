// Importamos la librería para leer el .env y el driver de postgres
require("dotenv").config();
const { Pool } = require("pg");

// Configuramos la conexión usando las variables de nuestro archivo .env
const pool = new Pool({
  user: process.env.DB_USER,
  host: "localhost",
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
});

module.exports = pool;
