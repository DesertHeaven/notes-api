const express = require("express");
const prisma = require("../prisma/client");
const {
  createNoteSchema,
  updateNoteSchema,
  formatValidationErrors,
} = require("../validation/note.validation");

const router = express.Router();

const asyncHandler = (routeHandler) => {
  return (req, res, next) => {
    Promise.resolve(routeHandler(req, res, next)).catch(next);
  };
};

const isValidId = (value) => {
  return Number.isInteger(value) && value > 0;
};

const sendValidationError = (res, error) => {
  return res.status(400).json({
    message: "Validation failed",
    errors: formatValidationErrors(error.issues),
  });
};

// GET /api/v1/notes
// Get all notes from PostgreSQL.
/**
 * @openapi
 * /api/v1/notes:
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
router.get("/notes", asyncHandler(async (req, res) => {
  const notes = await prisma.note.findMany({
    orderBy: {
      id: "asc",
    },
  });

  res.json(notes);
}));

// GET /api/v1/notes/:id
// Get one note by ID.
/**
 * @openapi
 * /api/v1/notes/{id}:
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
router.get("/notes/:id", asyncHandler(async (req, res) => {
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

// POST /api/v1/notes
// Create a new note in PostgreSQL.
/**
 * @openapi
 * /api/v1/notes:
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
router.post("/notes", asyncHandler(async (req, res) => {
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

// PATCH /api/v1/notes/:id
// Partially update one note by ID.
/**
 * @openapi
 * /api/v1/notes/{id}:
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
router.patch("/notes/:id", asyncHandler(async (req, res) => {
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

// DELETE /api/v1/notes/:id
// Delete one note by ID.
/**
 * @openapi
 * /api/v1/notes/{id}:
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
router.delete("/notes/:id", asyncHandler(async (req, res) => {
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

module.exports = router;
