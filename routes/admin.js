const { Router } = require("express");

const adminRouter = Router();

adminRouter.post("/signup", function (req, res) {
  res.json({
    message: "admin sign up endpoint",
  });
});

adminRouter.post("/signin", function (req, res) {
  res.json({
    message: "admin sign in endpoint",
  });
});

adminRouter.post("/course", function (req, res) {
  res.json({
    message: "admin create course endpoint",
  });
});

adminRouter.put("/course", function (req, res) {
  res.json({
    message: "admin update course endpoint",
  });
});

adminRouter.get("/course/bulk", function (req, res) {
  res.json({
    message: "admin get courses endpoint",
  });
});

module.exports = {
  adminRouter: adminRouter,
};
