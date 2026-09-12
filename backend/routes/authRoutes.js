// const express = require('express');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const authMiddleware = require('../middleware/authMiddleware');

// const router = express.Router();

// const allowedRoles = ['teacher', 'student'];

// const normalizeEmail = (email = '') => email.trim().toLowerCase();
// const normalizeUsername = (username = '') => username.trim().toLowerCase();
// const normalizeRole = (role = '') => (role === 'faculty' ? 'teacher' : role);

// const createToken = (user) => jwt.sign(
//   { id: user._id, role: user.role, canPostNotices: user.canPostNotices },
//   process.env.JWT_SECRET,
//   { expiresIn: '1d' }
// );

// const getPublicUser = (user) => ({
//   id: user._id,
//   name: user.name,
//   username: user.username || '',
//   email: user.email,
//   role: normalizeRole(user.role),
//   canPostNotices: Boolean(user.canPostNotices),
//   phoneNumber: user.phoneNumber || '',
//   branch: user.branch || '',
//   rollNumber: user.rollNumber || ''
// });

// // Register
// router.post('/register', async (req, res) => {
//   const {
//     name,
//     email,
//     password,
//     role,
//     username,
//     phoneNumber,
//     branch,
//     rollNumber
//   } = req.body;

//   try {
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "Name, email and password are required" });
//     }

//     const normalizedEmail = normalizeEmail(email);
//     const requestedRole = normalizeRole(role);
//     const normalizedRole = allowedRoles.includes(requestedRole) ? requestedRole : 'student';

//     if (requestedRole === 'admin') {
//       return res.status(403).json({ message: "Admin registration is disabled. Use admin login only." });
//     }

//     if (!phoneNumber || !phoneNumber.trim()) {
//       return res.status(400).json({ message: "Phone number is required" });
//     }

//     if (normalizedRole === 'student') {
//       if (!branch || !branch.trim() || !rollNumber || !rollNumber.trim()) {
//         return res.status(400).json({ message: "Branch and roll number are required for students" });
//       }
//     }

//     let user = await User.findOne({ email: normalizedEmail });
//     if (user) return res.status(400).json({ message: "User already exists" });

//     let normalizedUsername = '';
//     if (username && username.trim()) {
//       normalizedUsername = normalizeUsername(username);
//       const usernameExists = await User.findOne({ username: normalizedUsername });
//       if (usernameExists) {
//         return res.status(400).json({ message: "Username already exists" });
//       }
//     }

//     if (normalizedRole === 'student') {
//       const existingRoll = await User.findOne({ rollNumber: rollNumber.trim() });
//       if (existingRoll) {
//         return res.status(400).json({ message: "Roll number already exists" });
//       }
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     user = new User({
//       name: name.trim(),
//       username: normalizedUsername || undefined,
//       email: normalizedEmail,
//       password: hashedPassword,
//       role: normalizedRole,
//       canPostNotices: normalizedRole === 'teacher',
//       phoneNumber: phoneNumber.trim(),
//       branch: normalizedRole === 'student' ? branch.trim() : '',
//       rollNumber: normalizedRole === 'student' ? rollNumber.trim() : ''
//     });

//     await user.save();

//     res.status(201).json({ message: "User registered successfully" });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Login
// router.post('/login', async (req, res) => {
//   const identifier = req.body.identifier || req.body.email || req.body.username;
//   const { password } = req.body;

//   try {
//     if (!identifier || !password) {
//       return res.status(400).json({ message: "Username/email and password are required" });
//     }

//     const normalizedInput = identifier.trim().toLowerCase();
//     let user = await User.findOne({
//       $or: [
//         { email: normalizeEmail(normalizedInput) },
//         { username: normalizeUsername(normalizedInput) }
//       ]
//     });

//     // Failsafe: auto-bootstrap default admin on first login attempt.
//     if (!user && normalizedInput === 'admin' && password === 'admin') {
//       const existingAdmin = await User.findOne({ role: 'admin' });
//       if (!existingAdmin) {
//         const hashedPassword = await bcrypt.hash('admin', 10);
//         user = await User.create({
//           name: 'System Admin',
//           username: 'admin',
//           email: 'admin@bvrithyderabad.edu.in',
//           password: hashedPassword,
//           role: 'admin',
//           canPostNotices: true
//         });
//       } else {
//         user = existingAdmin;
//       }
//     }

//     if (!user) return res.status(404).json({ message: "Account not found. Please register first." });

//     // Hard fallback requested by product spec: default admin/admin must always work.
//     if (normalizedInput === 'admin' && password === 'admin' && user.role === 'admin') {
//       user.username = 'admin';
//       if (!user.email) {
//         user.email = 'admin@bvrithyderabad.edu.in';
//       }

//       const adminPasswordHash = await bcrypt.hash('admin', 10);
//       user.password = adminPasswordHash;
//       await user.save();

//       const token = createToken(user);
//       return res.json({ token, user: getPublicUser(user) });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: "Incorrect password." });

//     const token = createToken(user);

//     res.json({ token, user: getPublicUser(user) });

//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.get('/me', authMiddleware, async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json({ user: getPublicUser(user) });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// router.patch('/me', authMiddleware, async (req, res) => {
//   try {
//     const { name, email, currentPassword, newPassword, phoneNumber, branch, rollNumber } = req.body;

//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (name && !name.trim()) {
//       return res.status(400).json({ message: "Name cannot be empty" });
//     }

//     if (email) {
//       const normalizedEmail = normalizeEmail(email);
//       const emailOwner = await User.findOne({ email: normalizedEmail });

//       if (emailOwner && emailOwner._id.toString() !== user._id.toString()) {
//         return res.status(400).json({ message: "Email already in use" });
//       }

//       user.email = normalizedEmail;
//     }

//     if (req.body.username && req.body.username.trim()) {
//       const normalizedUsername = normalizeUsername(req.body.username);
//       const usernameOwner = await User.findOne({ username: normalizedUsername });

//       if (usernameOwner && usernameOwner._id.toString() !== user._id.toString()) {
//         return res.status(400).json({ message: "Username already in use" });
//       }

//       user.username = normalizedUsername;
//     }

//     if (name) {
//       user.name = name.trim();
//     }

//     if (phoneNumber !== undefined) {
//       user.phoneNumber = phoneNumber.trim();
//     }

//     if (user.role === 'student') {
//       if (branch !== undefined) {
//         user.branch = branch.trim();
//       }
//       if (rollNumber !== undefined) {
//         const normalizedRoll = rollNumber.trim();
//         const rollOwner = await User.findOne({ rollNumber: normalizedRoll });
//         if (rollOwner && rollOwner._id.toString() !== user._id.toString()) {
//           return res.status(400).json({ message: "Roll number already in use" });
//         }
//         user.rollNumber = normalizedRoll;
//       }
//     }

//     if (newPassword) {
//       if (!currentPassword) {
//         return res.status(400).json({ message: "Current password is required to set a new password" });
//       }

//       const isMatch = await bcrypt.compare(currentPassword, user.password);
//       if (!isMatch) {
//         return res.status(400).json({ message: "Current password is incorrect" });
//       }

//       user.password = await bcrypt.hash(newPassword, 10);
//     }

//     await user.save();

//     res.json({
//       message: "Profile updated successfully",
//       user: getPublicUser(user)
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const createToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

const getPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  username: user.username || "",
  email: user.email,
  role: user.role,
  phoneNumber: user.phoneNumber || "",
  branch: user.branch || "",
  rollNumber: user.rollNumber || ""
});


// ================= REGISTER =================

router.post("/register", async (req, res) => {

  try {

    const {
      name,
      username,
      email,
      phoneNumber,
      branch,
      rollNumber,
      password,
      role
    } = req.body;

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const normalizedPhoneNumber = String(phoneNumber || "").trim();
    const normalizedBranch = String(branch || "").trim();
    const normalizedRollNumber = String(rollNumber || "").trim();
    const normalizedRole = String(role || "student").trim();

    if (!normalizedName || !normalizedEmail || !password)
      return res.status(400).json("Name, Email and Password required");

    if (normalizedRole === "student") {
      if (!normalizedBranch || !normalizedRollNumber)
        return res.status(400).json("Branch and Roll Number required for students");
    }

    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) return res.status(400).json("Email already exists");

    if (normalizedUsername) {
      const usernameExists = await User.findOne({ username: normalizedUsername });
      if (usernameExists) return res.status(400).json("Username already exists");
    }

    // Only students persist rollNumber/branch; avoid collisions with faculty/admin "employee id" inputs.
    if (normalizedRole === "student" && normalizedRollNumber) {
      const rollExists = await User.findOne({ rollNumber: normalizedRollNumber });
      if (rollExists) return res.status(400).json("Roll Number already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name: normalizedName,
      username: normalizedUsername || undefined,
      email: normalizedEmail,
      phoneNumber: normalizedPhoneNumber,
      branch: normalizedRole === "student" ? normalizedBranch : undefined,
      rollNumber: normalizedRole === "student" ? normalizedRollNumber : undefined,
      password: hashedPassword,
      role: normalizedRole
    });

    await user.save();

    res.json({
      message: "User registered successfully"
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});



// ================= LOGIN =================

router.post("/login", async (req, res) => {

  try {

    const { identifier, password } = req.body;

    const normalizedIdentifier = String(identifier || "").trim();
    const normalizedPassword = String(password || "");

    if (!normalizedIdentifier || !normalizedPassword)
      return res.status(400).json("Email/Username and Password required");

    const identifierLower = normalizedIdentifier.toLowerCase();
    const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const emailRegex = new RegExp(`^${escapeRegExp(normalizedIdentifier)}$`, "i");
    const user = await User.findOne({
      $or: [
        { email: identifierLower },
        { username: identifierLower },
        // Backward compatibility if older documents stored mixed-case emails.
        { email: emailRegex }
      ]
    });

    if (!user)
      return res.status(404).json("User not found");

    const valid = await bcrypt.compare(normalizedPassword, user.password);

    if (!valid)
      return res.status(400).json("Wrong password");

    const token = createToken(user);

    res.json({
      token,
      user: getPublicUser(user)
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});



// ================= GET PROFILE =================

router.get("/me", authMiddleware, async (req, res) => {

  try {

    const user = await User.findById(req.user.id).select("-password");

    if (!user)
      return res.status(404).json("User not found");

    res.json(getPublicUser(user));

  } catch (err) {
    res.status(500).json(err.message);
  }
});



// ================= UPDATE PROFILE =================

router.put("/me", authMiddleware, async (req, res) => {

  try {

    const { name, phoneNumber, branch, rollNumber } = req.body;

    const user = await User.findById(req.user.id);

    if (!user)
      return res.status(404).json("User not found");

    if (name) user.name = name;
    if (phoneNumber) user.phoneNumber = phoneNumber;

    if (user.role === "student") {
      if (branch) user.branch = branch;
      if (rollNumber) user.rollNumber = rollNumber;
    }

    await user.save();

    res.json({
      message: "Profile updated",
      user: getPublicUser(user)
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
