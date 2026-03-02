const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../data/store");

const router = express.Router();

// GET /api/deals — list all, optional ?stage= filter
router.get("/", function (req, res) {
  var results = db.deals;

  if (req.query.stage) {
    var stage = req.query.stage.toLowerCase();
    results = results.filter(function (d) { return d.stage === stage; });
  }

  res.json(results);
});

// GET /api/deals/pipeline — grouped by stage
router.get("/pipeline", function (req, res) {
  var pipeline = { qualified: [], proposal: [], negotiation: [], won: [] };
  db.deals.forEach(function (d) {
    if (pipeline[d.stage]) {
      pipeline[d.stage].push(d);
    }
  });
  res.json(pipeline);
});

// GET /api/deals/:id
router.get("/:id", function (req, res) {
  var deal = db.deals.find(function (d) { return d.id === req.params.id; });
  if (!deal) return res.status(404).json({ error: "Deal not found" });
  res.json(deal);
});

// POST /api/deals
router.post("/", function (req, res) {
  var body = req.body;
  if (!body.title || !body.company) {
    return res.status(400).json({ error: "Title and company are required" });
  }

  var deal = {
    id: uuidv4(),
    title: body.title,
    company: body.company,
    value: body.value || 0,
    stage: body.stage || "qualified",
    date: body.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  };

  db.deals.push(deal);
  db.stats.openDeals++;

  res.status(201).json(deal);
});

// PATCH /api/deals/:id/stage — move a deal to a new stage
router.patch("/:id/stage", function (req, res) {
  var deal = db.deals.find(function (d) { return d.id === req.params.id; });
  if (!deal) return res.status(404).json({ error: "Deal not found" });

  var validStages = ["qualified", "proposal", "negotiation", "won"];
  if (!req.body.stage || validStages.indexOf(req.body.stage) === -1) {
    return res.status(400).json({ error: "Invalid stage. Must be one of: " + validStages.join(", ") });
  }

  deal.stage = req.body.stage;
  res.json(deal);
});

// PUT /api/deals/:id
router.put("/:id", function (req, res) {
  var idx = db.deals.findIndex(function (d) { return d.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ error: "Deal not found" });

  var updated = Object.assign({}, db.deals[idx], req.body, { id: req.params.id });
  db.deals[idx] = updated;
  res.json(updated);
});

// DELETE /api/deals/:id
router.delete("/:id", function (req, res) {
  var idx = db.deals.findIndex(function (d) { return d.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ error: "Deal not found" });

  db.deals.splice(idx, 1);
  db.stats.openDeals--;
  res.status(204).end();
});

module.exports = router;
