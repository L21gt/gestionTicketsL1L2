import api from "./api";

const ticketService = {
  // Obtener tickets según el nivel del usuario
  getMyTickets: () => api.get("/tickets/my-level"),

  // Obtener detalle de un ticket
  getTicket: (id) => api.get(`/tickets/${id}`),

  // Crear ticket (Solo L1)
  createTicket: (data) => api.post("/tickets", data),

  // Acciones de estado
  escalateTicket: (id) => api.patch(`/tickets/${id}/escalate`),
  resolveTicket: (id) => api.patch(`/tickets/${id}/resolve`),

  // Comentarios
  getComments: (id) => api.get(`/tickets/${id}/comments`),
  postComment: (id, commentData) =>
    api.post(`/tickets/${id}/comments`, commentData),

  // Descargar reporte
  downloadReport: () =>
    api.get("/tickets/report/download", { responseType: "blob" }),

  // Obtener lista de productos
  getProducts: () => api.get("/tickets/products"),
};

export default ticketService;
