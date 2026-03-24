const express = require("express");
const router = express.Router();
const ticketController = require("../Controllers/ticketController");
const { verifyToken } = require("../middlewares/authMiddleware");

// Ver tickets del nivel actual
router.get(
  "/my-level",
  verifyToken(["L1", "L2"]),
  ticketController.getMyTickets,
);

// Acciones de estado
router.patch("/:id/escalate", verifyToken(["L1"]), ticketController.escalate);
router.patch(
  "/:id/resolve",
  verifyToken(["L1", "L2"]),
  ticketController.resolve,
);

// Comentarios
router.post(
  "/:id/comments",
  verifyToken(["L1", "L2"]),
  ticketController.postComment,
);
router.get(
  "/:id/comments",
  verifyToken(["L1", "L2"]),
  ticketController.getComments,
);

// Crear un nuevo ticket (Solo L1 suele abrir casos)
router.post("/", verifyToken(["L1"]), ticketController.create);

// Obtener lista de productos para el frontend
router.get(
  "/products",
  verifyToken(["L1", "L2"]),
  ticketController.getProducts,
);

// Obtener detalle de un ticket
router.get("/:id", verifyToken(["L1", "L2"]), ticketController.getTicket);

// Descargar reporte PDF de tickets
router.get(
  "/report/download",
  verifyToken(["L1", "L2"]),
  ticketController.getReport,
);

module.exports = router;
