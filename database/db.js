const mongoose = require("mongoose");
mongoose.connect("");

const userSchema = new mongoose.Schema();

const adminSchema = new mongoose.Schema();

const courseSchema = new mongoose.Schema();

const purchaseSchema = new mongoose.Schema();

const User = mongoose.model("User", userSchema);
const Admin = mongoose.model("Admin", adminSchema);
const Course = mongoose.model("Course", courseSchema);
const Purchase = mongoose.model("Purchase", purchaseSchema);

module.exports = {
  User: User,
  Admin: Admin,
  Course: Course,
  Purchase: Purchase,
};
