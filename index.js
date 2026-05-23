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

app.post("/notes", (req, res) => {
  const newNote = req.body;

  notes.push(newNote);

  res.status(201).json({
    message: "Note created",
    note: newNote,
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
