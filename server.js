const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// 🔹 Middlewares (IMPORTANT: before routes)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Static Folder
app.use(express.static("public"));

// 🔹 Routes
const authRoutes = require("./routes/authRoutes");
const noticeRoutes = require("./routes/noticeRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/notices", noticeRoutes);

// 🔹 MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/digitalNoticeBoard")
.then(() => console.log("MongoDB Connected Successfully"))
.catch((err) => console.log("MongoDB Connection Error:", err));

// 🔹 Default Route
app.get("/", (req, res) => {
    res.send("Digital Notice Board Server Running");
});

// 🔹 Start Server
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});