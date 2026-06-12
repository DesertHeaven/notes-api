require("dotenv/config");

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { z } = require("zod");

const app = express();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const PORT = 3000;

// Middleware for reading JSON request body.
app.use(express.json());

const asyncHandler = (routeHandler) => {
  return (req, res, next) => {
    Promise.resolve(routeHandler(req, res, next)).catch(next);
  };
};

const isValidId = (value) => {
  return Number.isInteger(value) && value > 0;
};

const createNoteSchema = z.object({
  title: z.string().trim().min(1, "Title must be a non-empty string"),
  content: z.string().trim().min(1, "Content must be a non-empty string"),
});

const updateNoteSchema = createNoteSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least title or content is required",
  },
);

const formatValidationErrors = (issues) => {
  return issues.map((issue) => {
    return {
      field: issue.path.join(".") || "body",
      message: issue.message,
    };
  });
};

const sendValidationError = (res, error) => {
  return res.status(400).json({
    message: "Validation failed",
    errors: formatValidationErrors(error.issues),
  });
};

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
  apis: ["./index.js"],
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

// GET /notes
// Get all notes from PostgreSQL.
/**
 * @openapi
 * /notes:
 *   get:
 *     summary: Get all notes
 *     tags:
 *       - Notes
 *     responses:
 *       200:
 *         description: List of notes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get("/notes", asyncHandler(async (req, res) => {
  const notes = await prisma.note.findMany({
    orderBy: {
      id: "asc",
    },
  });

  res.json(notes);
}));

// GET /notes/:id
// Get one note by ID.
/**
 * @openapi
 * /notes/{id}:
 *   get:
 *     summary: Get one note by ID
 *     tags:
 *       - Notes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Found note
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Note'
 *       400:
 *         description: Invalid note ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.get("/notes/:id", asyncHandler(async (req, res) => {
  const noteId = Number(req.params.id);

  if (!isValidId(noteId)) {
    return res.status(400).json({
      message: "Invalid note ID",
    });
  }

  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
  });

  if (!note) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  res.json(note);
}));

// POST /notes
// Create a new note in PostgreSQL.
/**
 * @openapi
 * /notes:
 *   post:
 *     summary: Create a note
 *     tags:
 *       - Notes
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNoteInput'
 *     responses:
 *       201:
 *         description: Note created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoteResponse'
 *       400:
 *         description: Invalid title or content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationErrorResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.post("/notes", asyncHandler(async (req, res) => {
  const validationResult = createNoteSchema.safeParse(req.body);

  if (!validationResult.success) {
    return sendValidationError(res, validationResult.error);
  }

  const newNote = await prisma.note.create({
    data: validationResult.data,
  });

  res.status(201).json({
    message: "Note created",
    note: newNote,
  });
}));

// PATCH /notes/:id
// Partially update one note by ID.
/**
 * @openapi
 * /notes/{id}:
 *   patch:
 *     summary: Partially update a note
 *     tags:
 *       - Notes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNoteInput'
 *     responses:
 *       200:
 *         description: Note updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NoteResponse'
 *       400:
 *         description: Invalid ID, empty update body, or invalid field value
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - $ref: '#/components/schemas/MessageResponse'
 *                 - $ref: '#/components/schemas/ValidationErrorResponse'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.patch("/notes/:id", asyncHandler(async (req, res) => {
  const noteId = Number(req.params.id);

  if (!isValidId(noteId)) {
    return res.status(400).json({
      message: "Invalid note ID",
    });
  }

  const existingNote = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
  });

  if (!existingNote) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  const validationResult = updateNoteSchema.safeParse(req.body);

  if (!validationResult.success) {
    return sendValidationError(res, validationResult.error);
  }

  const updatedNote = await prisma.note.update({
    where: {
      id: noteId,
    },
    data: validationResult.data,
  });

  res.json({
    message: "Note updated",
    note: updatedNote,
  });
}));

// DELETE /notes/:id
// Delete one note by ID.
/**
 * @openapi
 * /notes/{id}:
 *   delete:
 *     summary: Delete a note
 *     tags:
 *       - Notes
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         example: 1
 *     responses:
 *       200:
 *         description: Note deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       400:
 *         description: Invalid note ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.delete("/notes/:id", asyncHandler(async (req, res) => {
  const noteId = Number(req.params.id);

  if (!isValidId(noteId)) {
    return res.status(400).json({
      message: "Invalid note ID",
    });
  }

  const existingNote = await prisma.note.findUnique({
    where: {
      id: noteId,
    },
  });

  if (!existingNote) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  await prisma.note.delete({
    where: {
      id: noteId,
    },
  });

  res.json({
    message: "Note deleted",
  });
}));

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
