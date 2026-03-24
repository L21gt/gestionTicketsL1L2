class User {
  constructor(id, fullName, email, role) {
    this.id = id;
    this.fullName = fullName;
    this.email = email;
    this.role = role; // 'L1' o 'L2'
  }
}

module.exports = User;
