const { Router } = require("express");
const adminRouter = Router();
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const bcrypt = require("bcrypt");
const { JWT_ADMIN_PASSWORD } = require("../config");
const { adminMiddleware } = require("../middleware/admin");
const { Admin, Course } = require("../database/db");
const multer = require("multer");
const path = require("path");

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Zod schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const signinSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const courseSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  price: z.number().min(0),
  imageUrl: z.string().url().optional(),
});

adminRouter.post("/signup", async function (req, res) {
  try {
    // Validate input
    const { email, password, firstName, lastName } = signupSchema.parse(
      req.body
    );

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    await Admin.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
    });

    res.json({
      message: "Signup successful",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

adminRouter.post("/signin", async function (req, res) {
  try {
    // Validate input
    const { email, password } = signinSchema.parse(req.body);

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password with hashed password
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
      },
      JWT_ADMIN_PASSWORD
    );

    res.json({
      message: "Signin successful",
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: "Validation failed",
        errors: error.errors,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

adminRouter.post(
  "/course",
  adminMiddleware,
  upload.single("image"),
  async function (req, res) {
    try {
      // Handle both uploaded file and imageUrl from request body
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      // Validate and get other inputs
      const { title, description, price } = courseSchema.parse({
        ...req.body,
        price: Number(req.body.price),
      });

      // Create course with admin's ID as creator
      const course = await Course.create({
        title,
        description,
        price,
        imageUrl,
        creatorId: req.adminId,
      });

      res.json({
        message: "Course created successfully",
        courseId: course._id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

adminRouter.put(
  "/course",
  adminMiddleware,
  upload.single("image"),
  async function (req, res) {
    try {
      // Handle both uploaded file and imageUrl from request body
      let imageUrl = req.body.imageUrl;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      // Validate and get other inputs
      const { title, description, price } = courseSchema.parse({
        ...req.body,
        price: Number(req.body.price),
      });

      // Create course with admin's ID as creator if it doesn't exist
      const course = await Course.findOneAndUpdate(
        { title, creatorId: req.adminId },
        {
          description,
          price,
          ...(imageUrl && { imageUrl }), // Update imageUrl if provided
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return the updated/created document
        }
      );

      res.json({
        message: course._id
          ? "Course updated successfully"
          : "Course created successfully",
        courseId: course._id,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

adminRouter.get("/course/bulk", adminMiddleware, async function (req, res) {
  try {
    const courses = await Course.find({
      creatorId: req.adminId,
    });

    res.json({
      courses: courses,
      message: "Courses fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = {
  adminRouter: adminRouter,
};
