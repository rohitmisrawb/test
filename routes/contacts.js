const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../data/store");

const router = express.Router();

// GET /api/contacts — list all, optional ?status= filter and ?q= search
router.get("/", function (req, res) {
  var results = db.contacts;

  if (req.query.status && req.query.status !== "all") {
    var status = req.query.status.toLowerCase().replace(/s$/, "");
    results = results.filter(function (c) { return c.status === status; });
  }

  if (req.query.q) {
    var q = req.query.q.toLowerCase();
    results = results.filter(function (c) {
      return c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q);
    });
  }

  res.json(results);
});

// GET /api/contacts/:id
router.get("/:id", function (req, res) {
  var contact = db.contacts.find(function (c) { return c.id === req.params.id; });
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

// POST /api/contacts
router.post("/", function (req, res) {
  var body = req.body;
  if (!body.name || !body.email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  var colors = ["#0052cc", "#00875a", "#6554c0", "#ff991f", "#de350b"];
  var contact = {
    id: uuidv4(),
    name: body.name,
    email: body.email,
    company: body.company || "",
    status: body.status || "lead",
    dealValue: body.dealValue || 0,
    lastActivity: "Just now",
    owner: body.owner || "—",
    color: colors[Math.floor(Math.random() * colors.length)],
  };

  db.contacts.unshift(contact);
  db.stats.totalContacts++;

  res.status(201).json(contact);
});

// PUT /api/contacts/:id
router.put("/:id", function (req, res) {
  var idx = db.contacts.findIndex(function (c) { return c.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ error: "Contact not found" });

  var updated = Object.assign({}, db.contacts[idx], req.body, { id: req.params.id });
  db.contacts[idx] = updated;
  res.json(updated);
});

// DELETE /api/contacts/:id
router.delete("/:id", function (req, res) {
  var idx = db.contacts.findIndex(function (c) { return c.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ error: "Contact not found" });

  db.contacts.splice(idx, 1);
  db.stats.totalContacts--;
  res.status(204).end();
});

module.exports = router;
