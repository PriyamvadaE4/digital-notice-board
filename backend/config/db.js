// const mongoose = require('mongoose');

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log("MongoDB Connected");
//   } catch (error) {
//     console.log(error);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;
require("dotenv").config()

const express = require("express")
const connectDB = require("./config/db")

const app = express()

connectDB()

app.use(express.json())

app.listen(5000,()=>{
console.log("Server running on port 5000")
})