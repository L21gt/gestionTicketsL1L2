const PDFDocument = require("pdfkit");

const generateTicketsReport = (tickets, res) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Reporte_Tickets.pdf",
      );

      doc.pipe(res);

      doc
        .fontSize(20)
        .text("Reporte de Tickets de Soporte", { align: "center" });
      doc.moveDown();
      doc
        .fontSize(10)
        .text(`Fecha: ${new Date().toLocaleDateString()}`, { align: "right" });
      doc.moveDown(2);

      if (tickets.length === 0) {
        doc
          .fontSize(14)
          .text("No hay tickets para mostrar.", { align: "center" });
      } else {
        tickets.forEach((ticket, index) => {
          doc
            .fontSize(14)
            .text(`Ticket #${index + 1}: ${ticket.subject}`, {
              underline: true,
            });
          doc.fontSize(10).text(`ID: ${ticket.ticket_id}`);
          doc.text(
            `Estado: ${ticket.status} | Nivel: L${ticket.current_level}`,
          );
          doc.moveDown(1.5);
        });
      }

      doc.end();
      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateTicketsReport };
