const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../data/store");

const router = express.Router();

// GET /api/activities
router.get("/", function (req, res) {
  res.json(db.activities);
});

// POST /api/activities
router.post("/", function (req, res) {
  var body = req.body;
  if (!body.type || !body.text) {
    return res.status(400).json({ error: "Type and text are required" });
  }

  var validTypes = ["email", "call", "meeting", "note"];
  if (validTypes.indexOf(body.type) === -1) {
    return res.status(400).json({ error: "Type must be one of: " + validTypes.join(", ") });
  }

  var activity = {
    id: uuidv4(),
    type: body.type,
    text: body.text,
    time: body.time || "Just now",
  };

  db.activities.unshift(activity);
  res.status(201).json(activity);
});

module.exports = router;
