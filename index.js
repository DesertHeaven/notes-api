require("dotenv/config");

const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

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

// GET /
// Main route.
app.get("/", (req, res) => {
  res.json({
    message: "Hello from Node.js API",
  });
});

// GET /notes
// Get all notes from PostgreSQL.
app.get("/notes", async (req, res) => {
  const notes = await prisma.note.findMany({
    orderBy: {
      id: "asc",
    },
  });

  res.json(notes);
});

// GET /notes/:id
// Get one note by ID.
app.get("/notes/:id", async (req, res) => {
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
});

// POST /notes
// Create a new note in PostgreSQL.
app.post("/notes", async (req, res) => {
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
});

// PATCH /notes/:id
// Partially update one note by ID.
app.patch("/notes/:id", async (req, res) => {
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
});

// DELETE /notes/:id
// Delete one note by ID.
app.delete("/notes/:id", async (req, res) => {
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
});

// Start server.
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
