// const bcrypt = require('bcryptjs');
// const User = require('../models/User');

// const DEFAULT_ADMIN_USERNAME = 'admin';
// const DEFAULT_ADMIN_PASSWORD = 'admin';
// const DEFAULT_ADMIN_EMAIL = 'admin@noticeboard.local';

// const bootstrapAdmin = async () => {
//   // Migrate old role naming if data already exists.
//   await User.updateMany({ role: 'faculty' }, { $set: { role: 'teacher', canPostNotices: true } });

//   let adminUser = await User.findOne({ role: 'admin' });

//   if (!adminUser) {
//     const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);

//     adminUser = new User({
//       name: 'System Admin',
//       username: DEFAULT_ADMIN_USERNAME,
//       email: DEFAULT_ADMIN_EMAIL,
//       password: hashedPassword,
//       role: 'admin',
//       canPostNotices: true
//     });

//     await adminUser.save();
//     // Keep one clear startup log for first-time setup.
//     console.log("Default admin created: username='admin', password='admin'");
//   }

//   if (!adminUser.username) {
//     adminUser.username = DEFAULT_ADMIN_USERNAME;
//     await adminUser.save();
//   }
// };

// module.exports = bootstrapAdmin;
