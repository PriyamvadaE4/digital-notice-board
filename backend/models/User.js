// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   username: {
//     type: String,
//     unique: true,
//     sparse: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['admin', 'teacher', 'student'],
//     default: 'student'
//   },
//   canPostNotices: {
//     type: Boolean,
//     default: false
//   },
//   phoneNumber: {
//     type: String,
//     trim: true
//   },
//   branch: {
//     type: String,
//     trim: true
//   },
//   rollNumber: {
//     type: String,
//     trim: true,
//     unique: true,
//     sparse: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('User', UserSchema);
// const mongoose = require('mongoose');

// const UserSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   username: {
//     type: String,
//     unique: true,
//     sparse: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     required: true
//   },
//   role: {
//     type: String,
//     enum: ['admin', 'teacher', 'student'],
//     default: 'student'
//   },
//   canPostNotices: {
//     type: Boolean,
//     default: false
//   },
//   phoneNumber: {
//     type: String,
//     trim: true
//   },
//   branch: {
//     type: String,
//     trim: true
//   },
//   rollNumber: {
//     type: String,
//     trim: true,
//     unique: true,
//     sparse: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('User', UserSchema);
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "faculty", "coordinator", "student"],
      default: "student"
    },
    canPostNotices: { type: Boolean, default: false },
    phoneNumber: { type: String, trim: true },
    branch: { type: String, trim: true },
    rollNumber: { type: String, trim: true, unique: true, sparse: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
