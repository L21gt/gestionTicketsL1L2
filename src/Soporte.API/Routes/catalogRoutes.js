const express = require("express");
const router = express.Router();
const pool = require("../../Soporte.Infrastructure/Persistence/db");
const { verifyToken } = require("../middlewares/authMiddleware");

// Obtener lista de productos para el frontend
router.get("/products", verifyToken(["L1", "L2"]), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT product_id, product_name FROM products",
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
