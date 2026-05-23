const express = require("express");

const app = express();

const PORT = 3000;

app.use(express.json());

const notes = [
  {
    id: 1,
    title: "Learn Node.js",
    content: "Understand how Express handles routes",
  },
  {
    id: 2,
    title: "Build CRUD API",
    content: "Create, read, update and delete notes",
  },
];

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Node.js API",
  });
});

app.get("/notes", (req, res) => {
  res.json(notes);
});

app.get("/notes/:id", (req, res) => {
  const noteId = Number(req.params.id);

  const note = notes.find((note) => note.id === noteId);

  if (!note) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  res.json(note);
});

app.post("/notes", (req, res) => {
  const newNote = req.body;

  notes.push(newNote);

  res.status(201).json({
    message: "Note created",
    note: newNote,
  });
});

app.delete("/notes/:id", (req, res) => {
  const noteId = Number(req.params.id);

  // Ищем индекс заметки в массиве.
  const noteIndex = notes.findIndex((note) => note.id === noteId);

  // Если заметка не найдена.
  if (noteIndex === -1) {
    return res.status(404).json({
      message: "Note not found",
    });
  }

  // Удаляем заметку из массива.
  notes.splice(noteIndex, 1);

  res.json({
    message: "Note deleted",
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
