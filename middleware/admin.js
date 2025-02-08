const jwt = require("jsonwebtoken");
const { JWT_ADMIN_PASSWORD } = require("../config");

function adminMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    const verifiedAdmin = jwt.verify(token, JWT_ADMIN_PASSWORD);

    if (!verifiedAdmin) {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    req.adminId = verifiedAdmin.adminId;
    next();
  } catch (error) {
    return res.status(401).json({
      error: error.message || "Authentication failed",
    });
  }
}

module.exports = {
  adminMiddleware: adminMiddleware,
};
