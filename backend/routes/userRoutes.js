// const express = require('express');
// const User = require('../models/User');
// const authMiddleware = require('../middleware/authMiddleware');

// const router = express.Router();
// const allowedRoles = ['admin', 'teacher', 'student'];
// const normalizeRole = (role = '') => (role === 'faculty' ? 'teacher' : role);

// const isAdmin = (req) => req.user.role === 'admin';
// const isFacultyOrAdmin = (req) => ['admin', 'teacher', 'faculty'].includes(req.user.role);

// // Get all users (Admin only)
// router.get('/', authMiddleware, async (req, res) => {
//   if (!isAdmin(req)) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const users = await User.find().select('-password');
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get all students (Admin + Faculty)
// router.get('/students', authMiddleware, async (req, res) => {
//   if (!isFacultyOrAdmin(req)) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const users = await User.find({ role: 'student' }).select('-password');
//     res.json(users);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Check one student by name (Admin + Faculty)
// router.get('/students/find', authMiddleware, async (req, res) => {
//   if (!isFacultyOrAdmin(req)) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const name = (req.query.name || '').trim();
//     if (!name) {
//       return res.status(400).json({ message: "Student name is required" });
//     }

//     const student = await User.findOne({
//       role: 'student',
//       name: { $regex: `^${name}$`, $options: 'i' }
//     }).select('-password');

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     res.json(student);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Update role/posting permission (Admin only)
// router.patch('/:id/access', authMiddleware, async (req, res) => {
//   if (!isAdmin(req)) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const { role, canPostNotices } = req.body;
//     const user = await User.findById(req.params.id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const normalizedRole = normalizeRole(role);

//     if (role && !allowedRoles.includes(normalizedRole)) {
//       return res.status(400).json({ message: "Invalid role" });
//     }

//     if (role) {
//       user.role = normalizedRole;
//       if (normalizedRole === 'admin' || normalizedRole === 'teacher') {
//         user.canPostNotices = true;
//       }
//     }

//     if (typeof canPostNotices === 'boolean') {
//       user.canPostNotices = user.role === 'student' ? canPostNotices : true;
//     }

//     await user.save();

//     res.json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       canPostNotices: user.canPostNotices,
//       phoneNumber: user.phoneNumber || '',
//       branch: user.branch || '',
//       rollNumber: user.rollNumber || ''
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Grant/revoke posting rights to student coordinators (Admin + Faculty)
// router.patch('/:id/posting-rights', authMiddleware, async (req, res) => {
//   if (!isFacultyOrAdmin(req)) {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const { canPostNotices } = req.body;
//     if (typeof canPostNotices !== 'boolean') {
//       return res.status(400).json({ message: "canPostNotices must be true or false" });
//     }

//     const user = await User.findById(req.params.id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.role !== 'student') {
//       return res.status(400).json({ message: "Posting rights can be changed only for students" });
//     }

//     user.canPostNotices = canPostNotices;
//     await user.save();

//     res.json({
//       id: user._id,
//       name: user.name,
//       email: user.email,
//       role: user.role,
//       canPostNotices: user.canPostNotices,
//       phoneNumber: user.phoneNumber || '',
//       branch: user.branch || '',
//       rollNumber: user.rollNumber || ''
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// module.exports = router;
// const router = require('express').Router()
// const User = require('../models/User')

// router.get('/all',async(req,res)=>{

// const users = await User.find()

// res.json(users)

// })

// router.delete('/:id',async(req,res)=>{

// await User.findByIdAndDelete(req.params.id)

// res.json("User deleted")

// })

// router.put('/make-coordinator/:id',async(req,res)=>{

// await User.findByIdAndUpdate(req.params.id,{role:"coordinator"})

// res.json("Role updated")

// })

// module.exports = router
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const isFacultyOrAdmin = (req) =>
  req.user?.role === "admin" || req.user?.role === "faculty" || req.user?.role === "teacher";


// ================= GET PROFILE =================

router.get("/profile/:id", authMiddleware, async (req,res)=>{

try{

const user = await User.findById(req.params.id).select("-password");

if(!user) return res.status(404).json("User not found");

res.json(user);

}catch(err){

res.status(500).json(err.message);

}

});


// ================= UPDATE PROFILE =================

router.put("/update/:id", authMiddleware, async (req,res)=>{

try{

const user = await User.findById(req.params.id);

if(!user) return res.status(404).json("User not found");

// user can update only own profile
if(req.user.id !== req.params.id && req.user.role !== "admin"){
return res.status(403).json("Access denied");
}

user.name = req.body.name || user.name;
user.username = req.body.username || user.username;
user.email = req.body.email || user.email;
user.phoneNumber = req.body.phoneNumber || user.phoneNumber;

if(user.role === "student"){
user.branch = req.body.branch || user.branch;
user.rollNumber = req.body.rollNumber || user.rollNumber;
}

await user.save();

res.json(user);

}catch(err){

res.status(500).json(err.message);

}

});


// ================= GET ALL USERS (ADMIN) =================

router.get("/all", authMiddleware, async (req,res)=>{

try{

if(req.user.role !== "admin"){
return res.status(403).json("Admin access required");
}

const users = await User.find().select("-password");

res.json(users);

}catch(err){

res.status(500).json(err.message);

}

});

// Alias: GET /api/users (ADMIN)
router.get("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json("Admin access required");
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// List students (ADMIN + FACULTY)
router.get("/students", authMiddleware, async (req, res) => {
  try {
    if (!isFacultyOrAdmin(req)) {
      return res.status(403).json("Only faculty or admin allowed");
    }

    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// List coordinators (ADMIN + FACULTY)
router.get("/coordinators", authMiddleware, async (req, res) => {
  try {
    if (!isFacultyOrAdmin(req)) {
      return res.status(403).json("Only faculty or admin allowed");
    }

    const coordinators = await User.find({ role: "coordinator" }).select("-password");
    res.json(coordinators);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// ================= DELETE USER (ADMIN) =================

router.delete("/:id", authMiddleware, async (req,res)=>{

try{

if(req.user.role !== "admin"){
return res.status(403).json("Admin access required");
}

await User.findByIdAndDelete(req.params.id);

res.json("User deleted");

}catch(err){

res.status(500).json(err.message);

}

});


// ================= MAKE COORDINATOR =================

router.put("/make-coordinator/:id", authMiddleware, async (req,res)=>{

try{

if(!isFacultyOrAdmin(req)){
return res.status(403).json("Only faculty or admin allowed");
}

const user = await User.findById(req.params.id);

if(!user) return res.status(404).json("User not found");

user.role = "coordinator";
user.canPostNotices = true;

await user.save();

res.json("Coordinator permission granted");

}catch(err){

res.status(500).json(err.message);

}

});

// ================= REMOVE COORDINATOR =================
router.put("/remove-coordinator/:id", authMiddleware, async (req, res) => {
  try {
    if (!isFacultyOrAdmin(req)) {
      return res.status(403).json("Only faculty or admin allowed");
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json("User not found");

    user.role = "student";
    user.canPostNotices = false;

    await user.save();

    res.json("Coordinator permission removed");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
