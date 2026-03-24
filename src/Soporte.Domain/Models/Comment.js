class Comment {
  constructor(id, ticketId, userId, commentText, createdAt) {
    this.id = id;
    this.ticketId = ticketId;
    this.userId = userId;
    this.commentText = commentText;
    this.createdAt = createdAt;
  }
}

module.exports = Comment;
