const pool = require("../../Soporte.Infrastructure/Persistence/db");
const {
  generateTicketsReport,
} = require("../../Soporte.Infrastructure/Reports/pdfGenerator");

const getTicketsByRole = async (userRole) => {
  // L1 ve tickets de nivel 1, L2 ve tickets de nivel 2
  const levelToView = userRole === "L1" ? 1 : 2;

  try {
    const query = `
            SELECT * FROM tickets 
            WHERE current_level = $1 
            AND deleted_at IS NULL
        `;
    const result = await pool.query(query, [levelToView]);
    return result.rows;
  } catch (error) {
    console.error("Error al obtener tickets:", error);
    throw error;
  }
};

const escalateTicket = async (ticketId, userId, userRole) => {
  // Regla de negocio: Solo L1 puede escalar
  if (userRole !== "L1") {
    throw new Error("Solo los técnicos de Nivel 1 pueden escalar tickets.");
  }

  try {
    const query = `
            UPDATE tickets 
            SET current_level = 2, 
                status = 'ESCALADO', 
                updated_at = CURRENT_TIMESTAMP
            WHERE ticket_id = $1 AND current_level = 1
            RETURNING *;
        `;

    const result = await pool.query(query, [ticketId]);

    if (result.rows.length === 0) {
      throw new Error("Ticket no encontrado o ya ha sido escalado.");
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error al escalar ticket:", error);
    throw error;
  }
};

const resolveTicket = async (ticketId, userRole) => {
  // Primero determinamos qué nivel de ticket le corresponde resolver a cada rol
  const allowedLevel = userRole === "L1" ? 1 : 2;

  try {
    // Intentamos actualizar el ticket solo si coincide con el nivel del usuario
    const query = `
            UPDATE tickets 
            SET status = 'RESUELTO', 
                updated_at = CURRENT_TIMESTAMP
            WHERE ticket_id = $1 AND current_level = $2
            RETURNING *;
        `;

    const result = await pool.query(query, [ticketId, allowedLevel]);

    if (result.rows.length === 0) {
      throw new Error(
        `No tienes permiso para resolver este ticket o el ticket no está en tu nivel (${allowedLevel}).`,
      );
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error al resolver ticket:", error);
    throw error;
  }
};

const addComment = async (ticketId, userId, text) => {
  try {
    const query = `
            INSERT INTO comments (ticket_id, user_id, content) -- Columna 'comment'
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
    const result = await pool.query(query, [ticketId, userId, text]);
    return result.rows[0];
  } catch (error) {
    console.error("Error al insertar comentario:", error.message);
    throw error;
  }
};

const getCommentsByTicket = async (ticketId) => {
  try {
    const query = `
        SELECT c.*, u.full_name as user_name 
        FROM comments c
        LEFT JOIN users u ON c.user_id = u.user_id
        WHERE c.ticket_id = $1
        ORDER BY c.created_at ASC;
    `;
    const result = await pool.query(query, [ticketId]);
    return result.rows;
  } catch (error) {
    console.error("Error al obtener comentarios:", error.message);
    throw error;
  }
};

const createTicket = async (ticketData) => {
  const { productId, userId, subject, description, type, impact } = ticketData;

  try {
    const query = `
            INSERT INTO tickets (
                product_id, 
                assigned_user_id, 
                subject, 
                description, 
                type, 
                impact, 
                current_level, 
                status
            )
            VALUES ($1, $2, $3, $4, $5, $6, 1, 'ABIERTO')
            RETURNING *;
        `;

    const values = [
      productId, // $1: UUID de la tabla products
      userId, // $2: El ID del usuario del Token (va a assigned_user_id)
      subject, // $3: VARCHAR
      description, // $4: TEXT
      type, // $5: ticket_type (ENUM)
      impact, // $6: ticket_impact (ENUM)
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error exacto en la BD:", error.message);
    throw error;
  }
};

const getTicketById = async (ticketId) => {
  try {
    const query = `
            SELECT t.*, p.product_name, c.company_name as customer_name, u.full_name as assigned_user
            FROM tickets t
            LEFT JOIN products p ON t.product_id = p.product_id
            LEFT JOIN customers c ON p.nit_customer = c.nit
            LEFT JOIN users u ON t.assigned_user_id = u.user_id
            WHERE t.ticket_id = $1;
        `;
    const result = await pool.query(query, [ticketId]);

    if (result.rows.length === 0) {
      throw new Error("Ticket no encontrado");
    }
    return result.rows[0];
  } catch (error) {
    console.error("Error al obtener el detalle del ticket:", error.message);
    throw error;
  }
};

// Función para obtener la lista de productos (usada en el controlador)
const getAllProducts = async () => {
  try {
    const query =
      "SELECT product_id, product_name FROM products ORDER BY product_name ASC";
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("Error al obtener productos de la BD:", error.message);
    throw error;
  }
};

// Función para generar y descargar el reporte PDF de tickets según el rol
const downloadPDFReport = async (role, res) => {
  try {
    const tickets = await getTicketsByRole(role);

    await generateTicketsReport(tickets, res);
  } catch (error) {
    console.error("Error al generar el reporte:", error.message);
    throw error;
  }
};

module.exports = {
  getTicketsByRole,
  escalateTicket,
  resolveTicket,
  getTicketById,
  addComment,
  getCommentsByTicket,
  createTicket,
  downloadPDFReport,
  getAllProducts,
};
