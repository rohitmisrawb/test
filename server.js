const express = require("express");
const path = require("path");

const contactsRouter = require("./routes/contacts");
const dealsRouter = require("./routes/deals");
const tasksRouter = require("./routes/tasks");
const activitiesRouter = require("./routes/activities");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/contacts", contactsRouter);
app.use("/api/deals", dealsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/activities", activitiesRouter);

// Serve the front-end for any non-API route
app.get("/{*splat}", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, function () {
  console.log("CRM server running on http://localhost:" + PORT);
});

module.exports = app;
