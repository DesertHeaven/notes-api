const express = require("express");

const app = express();

const PORT = 3000;

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

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
