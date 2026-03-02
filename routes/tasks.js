const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../data/store");

const router = express.Router();

// GET /api/tasks
router.get("/", function (req, res) {
  res.json(db.tasks);
});

// POST /api/tasks
router.post("/", function (req, res) {
  var body = req.body;
  if (!body.text) {
    return res.status(400).json({ error: "Task text is required" });
  }

  var task = {
    id: uuidv4(),
    text: body.text,
    due: body.due || "",
    completed: false,
  };

  db.tasks.push(task);
  res.status(201).json(task);
});

// PATCH /api/tasks/:id — toggle completed
router.patch("/:id", function (req, res) {
  var task = db.tasks.find(function (t) { return t.id === req.params.id; });
  if (!task) return res.status(404).json({ error: "Task not found" });

  if (typeof req.body.completed === "boolean") {
    task.completed = req.body.completed;
  }
  if (req.body.text) {
    task.text = req.body.text;
  }
  if (req.body.due) {
    task.due = req.body.due;
  }

  res.json(task);
});

// DELETE /api/tasks/:id
router.delete("/:id", function (req, res) {
  var idx = db.tasks.findIndex(function (t) { return t.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ error: "Task not found" });

  db.tasks.splice(idx, 1);
  res.status(204).end();
});

module.exports = router;
