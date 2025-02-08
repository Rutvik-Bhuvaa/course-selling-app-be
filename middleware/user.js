const jwt = require("jsonwebtoken");
const { JWT_USER_PASSWORD } = require("../config");

function userMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    // Use the token directly or remove 'Bearer ' if present
    const tokenString = token.startsWith("Bearer ")
      ? token.split(" ")[1]
      : token;

    const verifiedUser = jwt.verify(tokenString, JWT_USER_PASSWORD);

    if (!verifiedUser) {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    req.userId = verifiedUser.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      error: error.message || "Authentication failed",
    });
  }
}

module.exports = {
  userMiddleware: userMiddleware,
};
