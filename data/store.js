const { v4: uuidv4 } = require("uuid");

// ── In-memory data store ──────────────────────────────
const db = {
  contacts: [
    { id: uuidv4(), name: "Alice Smith", email: "alice@techcorp.io", company: "TechCorp", status: "customer", dealValue: 24000, lastActivity: "2 hours ago", owner: "Jane D.", color: "#0052cc" },
    { id: uuidv4(), name: "Bob Johnson", email: "bob@acmeinc.com", company: "Acme Inc.", status: "lead", dealValue: 18500, lastActivity: "Yesterday", owner: "Mark R.", color: "#00875a" },
    { id: uuidv4(), name: "Carol Williams", email: "carol@globalsoft.com", company: "GlobalSoft", status: "prospect", dealValue: 45000, lastActivity: "3 days ago", owner: "Jane D.", color: "#6554c0" },
    { id: uuidv4(), name: "David Martinez", email: "david@startup.co", company: "Startup Co", status: "lead", dealValue: 12000, lastActivity: "1 week ago", owner: "Sara K.", color: "#ff991f" },
    { id: uuidv4(), name: "Emily Lee", email: "emily@megacorp.net", company: "MegaCorp", status: "churned", dealValue: 32000, lastActivity: "2 weeks ago", owner: "Mark R.", color: "#de350b" },
  ],

  deals: [
    { id: uuidv4(), title: "Website Redesign", company: "TechCorp", value: 24000, stage: "qualified", date: "Jan 15" },
    { id: uuidv4(), title: "Mobile App", company: "Startup Co", value: 12000, stage: "qualified", date: "Feb 3" },
    { id: uuidv4(), title: "Cloud Migration", company: "GlobalSoft", value: 45000, stage: "proposal", date: "Feb 10" },
    { id: uuidv4(), title: "Data Analytics", company: "Acme Inc.", value: 18500, stage: "proposal", date: "Feb 20" },
    { id: uuidv4(), title: "ERP Integration", company: "MegaCorp", value: 68000, stage: "negotiation", date: "Mar 1" },
    { id: uuidv4(), title: "Security Audit", company: "TechCorp", value: 15200, stage: "won", date: "Feb 28" },
    { id: uuidv4(), title: "SEO Package", company: "Startup Co", value: 8400, stage: "won", date: "Feb 25" },
  ],

  tasks: [
    { id: uuidv4(), text: "Follow up with Alice Smith", due: "Overdue", completed: false },
    { id: uuidv4(), text: "Prepare proposal for GlobalSoft", due: "Today", completed: false },
    { id: uuidv4(), text: "Demo call with Startup Co", due: "Tomorrow", completed: false },
    { id: uuidv4(), text: "Review MegaCorp contract", due: "Mar 4", completed: false },
    { id: uuidv4(), text: "Quarterly pipeline review", due: "Mar 7", completed: false },
  ],

  activities: [
    { id: uuidv4(), type: "email", text: '<strong>Jane D.</strong> sent a follow-up email to <strong>Alice Smith</strong>', time: "2 hours ago" },
    { id: uuidv4(), type: "call", text: '<strong>Mark R.</strong> completed a discovery call with <strong>Bob Johnson</strong>', time: "4 hours ago" },
    { id: uuidv4(), type: "meeting", text: '<strong>Sara K.</strong> scheduled a demo with <strong>David Martinez</strong>', time: "Yesterday at 3:45 PM" },
    { id: uuidv4(), type: "note", text: '<strong>Jane D.</strong> added a note to <strong>GlobalSoft</strong> deal', time: "Yesterday at 11:20 AM" },
    { id: uuidv4(), type: "email", text: '<strong>Mark R.</strong> sent a proposal to <strong>Acme Inc.</strong>', time: "2 days ago" },
  ],

  stats: {
    totalContacts: 1248,
    openDeals: 37,
    pipelineValue: 482000,
    wonThisMonth: 64200,
  },
};

module.exports = db;
