// const jwt = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//   const authHeader = req.header('Authorization');
//   const token = authHeader && authHeader.startsWith('Bearer ')
//     ? authHeader.replace('Bearer ', '').trim()
//     : authHeader;

//   if (!token) {
//     return res.status(401).json({ message: "No token, authorization denied" });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded;
//     next();
//   } catch (error) {
//     res.status(400).json({ message: "Invalid token" });
//   }
// };

// module.exports = authMiddleware;
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

try{

// Get token from header
const authHeader = req.headers.authorization;

if(!authHeader){

return res.status(401).json({
message:"Access Denied. No Token Provided"
});

}

// Format: Bearer token
const token = authHeader.split(" ")[1];

if(!token){

return res.status(401).json({
message:"Invalid Token Format"
});

}

const verified = jwt.verify(token,process.env.JWT_SECRET);

req.user = verified;

next();

}catch(err){

return res.status(401).json({
message:"Token Invalid or Expired"
});

}

};

module.exports = authMiddleware;