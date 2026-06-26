require("dotenv/config");

const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const notesRouter = require("./routes/notes.routes");

const app = express();

const PORT = 3000;

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
        url: `http://localhost:${PORT}`,
        description: "Local development server",
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

app.use(notesRouter);

app.use((err, req, res, next) => {
  console.error(err);

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
