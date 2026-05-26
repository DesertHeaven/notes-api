require("dotenv/config");

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

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
 *           example: Learn Swagger
 *         content:
 *           type: string
 *           example: Add OpenAPI docs to Express.
 *     UpdateNoteInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: Updated title
 *         content:
 *           type: string
 *           example: Updated content
 *     MessageResponse:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           example: Note not found
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

  if (Number.isNaN(noteId)) {
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
 *         description: Title and content are required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
app.post("/notes", asyncHandler(async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({
      message: "Title and content are required",
    });
  }

  const newNote = await prisma.note.create({
    data: {
      title,
      content,
    },
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
 *         description: Invalid ID or empty update body
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
app.patch("/notes/:id", asyncHandler(async (req, res) => {
  const noteId = Number(req.params.id);

  if (Number.isNaN(noteId)) {
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

  const { title, content } = req.body;

  if (title === undefined && content === undefined) {
    return res.status(400).json({
      message: "At least title or content is required",
    });
  }

  const data = {};

  if (title !== undefined) {
    data.title = title;
  }

  if (content !== undefined) {
    data.content = content;
  }

  const updatedNote = await prisma.note.update({
    where: {
      id: noteId,
    },
    data,
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

  if (Number.isNaN(noteId)) {
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

  res.status(500).json({
    message: "Internal server error",
  });
});

// Start server.
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
