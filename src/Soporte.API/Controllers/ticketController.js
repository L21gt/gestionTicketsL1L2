const ticketService = require("../../Soporte.Application/Services/ticketService");

// Obtener tickets según el nivel (L1 o L2)
const getMyTickets = async (req, res) => {
  try {
    const tickets = await ticketService.getTicketsByRole(req.user.role);
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Escalar un ticket (Solo L1)
const escalate = async (req, res) => {
  try {
    const updatedTicket = await ticketService.escalateTicket(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    res.json({ message: "Ticket escalado al Nivel 2", ticket: updatedTicket });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Resolver un ticket (L1 o L2 según nivel)
const resolve = async (req, res) => {
  try {
    const updatedTicket = await ticketService.resolveTicket(
      req.params.id,
      req.user.role,
    );
    res.json({ message: "Ticket resuelto con éxito", ticket: updatedTicket });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Agregar comentario
const postComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await ticketService.addComment(
      req.params.id,
      req.user.id,
      text,
    );
    res.status(201).json({ message: "Comentario añadido", data: comment });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener comentarios
const getComments = async (req, res) => {
  try {
    const comments = await ticketService.getCommentsByTicket(req.params.id);
    res.json(comments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Crear un nuevo ticket
const create = async (req, res) => {
  try {
    // 1. Extraemos TODOS los datos que manda el modal de React
    const { product_id, subject, description, type, impact } = req.body;

    // 2. Tomamos el ID del usuario logueado (técnico L1)
    const assigned_user_id = req.user.id;

    // 3. Llamamos al servicio
    const newTicket = await ticketService.createTicket({
      product_id,
      assigned_user_id,
      subject,
      description,
      type,
      impact,
    });

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener detalle de un ticket
const getTicket = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    res.json(ticket);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// Generar y descargar reporte PDF de tickets
const getReport = async (req, res) => {
  try {
    // Le pasamos el rol del usuario logueado y el objeto de respuesta (res)
    await ticketService.downloadPDFReport(req.user.role, res);
  } catch (error) {
    res.status(500).json({ error: "Hubo un problema al generar el PDF" });
  }
};

// Función para obtener la lista de productos
const getProducts = async (req, res) => {
  try {
    const products = await ticketService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyTickets,
  escalate,
  resolve,
  getProducts,
  postComment,
  getComments,
  create,
  getTicket,
  getReport,
};
