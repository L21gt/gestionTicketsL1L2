class Ticket {
  constructor(id, subject, description, level, status) {
    this.id = id;
    this.subject = subject;
    this.description = description;
    this.level = level;
    this.status = status;
  }
}
module.exports = Ticket;
