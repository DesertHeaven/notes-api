require("dotenv/config");

const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const apiKeyMiddleware = require("./middleware/api-key.middleware");
const notesRouter = require("./routes/notes.routes");

const app = express();

const PORT = process.env.PORT || 3000;
const LOCAL_CLIENT_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:4200",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:4200",
  "http://127.0.0.1:5173",
];

const clientOrigins = process.env.CLIENT_ORIGINS
  ? process.env.CLIENT_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : LOCAL_CLIENT_ORIGINS;

const corsOptions = {
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
};

app.use(cors(corsOptions));

// Middleware for reading JSON request body.
app.use(express.json());

const openapiSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Notes API",
      version: "1.0.0",
      description: "Simple CRUD API for notes.",
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
  },
  apis: ["./index.js", "./routes/*.js"],
});

app.get("/api-docs-json", (req, res) => {
  res.json(openapiSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     ApiKeyAuth:
 *       type: apiKey
 *       in: header
 *       name: x-api-key
 *   schemas:
 *     Note:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - content
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: Learn Swagger
 *         content:
 *           type: string
 *           example: Describe the API contract with OpenAPI.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-05-26T10:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2026-05-26T10:00:00.000Z"
 *     CreateNoteInput:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           example: Learn Swagger
 *         content:
 *           type: string
 *           minLength: 1
 *           example: Add OpenAPI docs to Express.
 *     UpdateNoteInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           example: Updated title
 *         content:
 *           type: string
 *           minLength: 1
 *           example: Updated content
 *     MessageResponse:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           example: Note not found
 *     HealthResponse:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *     ValidationIssue:
 *       type: object
 *       required:
 *         - field
 *         - message
 *       properties:
 *         field:
 *           type: string
 *           example: title
 *         message:
 *           type: string
 *           example: Title must be a non-empty string
 *     ValidationErrorResponse:
 *       type: object
 *       required:
 *         - message
 *         - errors
 *       properties:
 *         message:
 *           type: string
 *           example: Validation failed
 *         errors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ValidationIssue'
 *     NoteResponse:
 *       type: object
 *       required:
 *         - message
 *         - note
 *       properties:
 *         message:
 *           type: string
 *           example: Note created
 *         note:
 *           $ref: '#/components/schemas/Note'
 *   responses:
 *     Unauthorized:
 *       description: Invalid or missing API key
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageResponse'
 *     InternalServerError:
 *       description: Internal server error
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageResponse'
 */

// GET /
// Main route.
app.get("/", (req, res) => {
  res.json({
    message: "Hello from Node.js API",
  });
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Check API health
 *     tags:
 *       - System
 *     responses:
 *       200:
 *         description: API is running
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/v1", apiKeyMiddleware, notesRouter);

app.use((err, req, res, next) => {
  console.error(err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      message: "Origin not allowed by CORS",
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON body",
    });
  }

  res.status(500).json({
    message: "Internal server error",
  });
});

// Start server.
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
