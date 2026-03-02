const express = require("express");
const db = require("../data/store");

const router = express.Router();

// GET /api/stats — live computed stats
router.get("/", function (req, res) {
  var totalContacts = db.contacts.length;
  var openDeals = db.deals.filter(function (d) { return d.stage !== "won"; }).length;
  var pipelineValue = db.deals.reduce(function (sum, d) {
    return d.stage !== "won" ? sum + d.value : sum;
  }, 0);
  var wonThisMonth = db.deals.reduce(function (sum, d) {
    return d.stage === "won" ? sum + d.value : sum;
  }, 0);

  res.json({
    totalContacts: totalContacts,
    openDeals: openDeals,
    pipelineValue: pipelineValue,
    wonThisMonth: wonThisMonth,
  });
});

module.exports = router;
