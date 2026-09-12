// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const connectDB = require('./config/db');
// const bootstrapAdmin = require('./config/bootstrapAdmin');

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/notices', require('./routes/noticeRoutes'));
// app.use('/api/users', require('./routes/userRoutes'));

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   await connectDB();
//   await bootstrapAdmin();

//   app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// };

// startServer();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const noticeRoutes = require("./routes/noticeRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();


// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json());

// static folder for images
app.use("/uploads", express.static("uploads"));


// ================= ROUTES =================

app.use("/api/auth", authRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/users", userRoutes);


// ================= DATABASE CONNECTION =================

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/noticeboard")
.then(()=>{
    console.log("MongoDB Connected");
})
.catch((err)=>{
    console.log("MongoDB Connection Error:",err);
});


// ================= SERVER =================

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
});
