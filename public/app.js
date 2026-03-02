document.addEventListener("DOMContentLoaded", function () {

  // ═══════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str || ""));
    return div.innerHTML;
  }
  function getInitials(name) {
    return (name || "").split(" ").map(function (w) { return w[0] || ""; }).join("").toUpperCase().slice(0, 2);
  }
  function formatMoney(n) {
    return "$" + Number(n || 0).toLocaleString();
  }
  function capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  }

  // ── Toast ───────────────────────────────────────────
  function toast(msg, type) {
    var container = document.getElementById("toast-container");
    var el = document.createElement("div");
    el.className = "toast" + (type ? " " + type : "");
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(function () { el.remove(); }, 3000);
  }

  // ── Notifications ───────────────────────────────────
  var notifications = [];
  function addNotification(text) {
    notifications.unshift({ text: text, time: "Just now" });
    if (notifications.length > 20) notifications.pop();
    renderNotifications();
  }
  function renderNotifications() {
    var list = document.getElementById("notif-list");
    var dot = document.querySelector(".notif-dot");
    if (!list) return;
    if (notifications.length === 0) {
      list.innerHTML = '<div class="notif-empty">No notifications yet</div>';
      if (dot) dot.classList.remove("show");
      return;
    }
    if (dot) dot.classList.add("show");
    list.innerHTML = "";
    notifications.slice(0, 10).forEach(function (n) {
      var item = document.createElement("div");
      item.className = "notif-item";
      item.innerHTML = '<div>' + escapeHtml(n.text) + '</div><div class="notif-time">' + escapeHtml(n.time) + '</div>';
      list.appendChild(item);
    });
  }
  renderNotifications();

  var notifBtn = document.querySelector(".notif-btn");
  var notifDropdown = document.getElementById("notif-dropdown");
  if (notifBtn) {
    notifBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      notifDropdown.classList.toggle("open");
      document.querySelector(".notif-dot").classList.remove("show");
    });
  }
  document.addEventListener("click", function () {
    if (notifDropdown) notifDropdown.classList.remove("open");
  });

  // ═══════════════════════════════════════════════════════
  //  API HELPERS
  // ═══════════════════════════════════════════════════════
  function api(method, url, body) {
    var opts = { method: method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (r) {
      if (r.status === 204) return null;
      return r.json();
    });
  }

  // ═══════════════════════════════════════════════════════
  //  PAGE ROUTING
  // ═══════════════════════════════════════════════════════
  var sidebarLinks = document.querySelectorAll(".sidebar-link[data-page]");
  var pages = document.querySelectorAll(".page");
  var currentPage = "dashboard";

  function navigateTo(page) {
    currentPage = page;
    pages.forEach(function (p) { p.classList.remove("active"); });
    var target = document.getElementById("page-" + page);
    if (target) target.classList.add("active");

    sidebarLinks.forEach(function (l) {
      l.classList.toggle("active", l.dataset.page === page);
    });

    // Load data for the page
    if (page === "dashboard") loadDashboard();
    else if (page === "contacts") loadContactsPage();
    else if (page === "deals") loadDealsPage();
    else if (page === "pipeline") loadPipelinePage();
    else if (page === "tasks") loadTasksPage();
    else if (page === "activities") loadActivitiesPage();
  }

  sidebarLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      navigateTo(link.dataset.page);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  GLOBAL SEARCH
  // ═══════════════════════════════════════════════════════
  var globalSearch = document.querySelector(".topbar-search");
  var globalSearchTimer;
  if (globalSearch) {
    globalSearch.addEventListener("input", function () {
      clearTimeout(globalSearchTimer);
      globalSearchTimer = setTimeout(function () {
        var q = globalSearch.value.trim();
        if (!q) { navigateTo(currentPage); return; }
        // Search contacts and show results on contacts page
        navigateTo("contacts");
        var searchInput = document.getElementById("contacts-search");
        if (searchInput) searchInput.value = q;
        loadContactsPage("q=" + encodeURIComponent(q));
      }, 300);
    });
  }

  // ═══════════════════════════════════════════════════════
  //  DASHBOARD
  // ═══════════════════════════════════════════════════════
  function loadDashboard() {
    loadStats();
    loadDashContacts();
    loadDashActivities();
    loadDashTasks();
    updateBadges();
  }

  // ── Stats ───────────────────────────────────────────
  function loadStats() {
    api("GET", "/api/stats").then(function (stats) {
      var row = document.getElementById("stats-row");
      if (!row) return;
      row.innerHTML =
        statCard("Total Contacts", stats.totalContacts.toLocaleString()) +
        statCard("Open Deals", stats.openDeals.toLocaleString()) +
        statCard("Pipeline Value", formatMoney(stats.pipelineValue)) +
        statCard("Won This Month", formatMoney(stats.wonThisMonth));
    });
  }
  function statCard(label, value) {
    return '<div class="stat-card"><div class="stat-label">' + label + '</div><div class="stat-value">' + value + '</div></div>';
  }

  // ── Dashboard Contacts Table ────────────────────────
  var dashFilter = "all";
  function loadDashContacts(query) {
    var url = query || "";
    api("GET", "/api/contacts" + (url ? "?" + url : "")).then(function (contacts) {
      renderContactTable(contacts, "dash-tbody");
    });
  }

  // Dashboard filter buttons
  document.querySelectorAll("#page-dashboard .filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#page-dashboard .filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      dashFilter = btn.dataset.filter;
      var q = dashFilter === "all" ? "" : "status=" + encodeURIComponent(dashFilter);
      loadDashContacts(q);
    });
  });

  // Dashboard view toggle
  var viewBtns = document.querySelectorAll(".view-toggle button");
  var dashTableView = document.getElementById("dash-table-view");
  var dashBoardView = document.getElementById("dash-board-view");
  viewBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      viewBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      if (btn.dataset.view === "board") {
        dashTableView.classList.add("hidden");
        dashBoardView.classList.remove("hidden");
        loadDashContactsBoard();
      } else {
        dashTableView.classList.remove("hidden");
        dashBoardView.classList.add("hidden");
        var q = dashFilter === "all" ? "" : "status=" + encodeURIComponent(dashFilter);
        loadDashContacts(q);
      }
    });
  });

  function loadDashContactsBoard() {
    var q = dashFilter === "all" ? "" : "status=" + encodeURIComponent(dashFilter);
    api("GET", "/api/contacts" + (q ? "?" + q : "")).then(function (contacts) {
      var board = document.getElementById("contact-board");
      if (!board) return;
      board.innerHTML = "";
      contacts.forEach(function (c) {
        var card = document.createElement("div");
        card.className = "contact-card";
        card.dataset.id = c.id;
        card.innerHTML =
          '<div class="contact-card-header">' +
            '<div class="contact-avatar" style="background:' + (c.color || "#0052cc") + '">' + getInitials(c.name) + '</div>' +
            '<div><div class="contact-card-name">' + escapeHtml(c.name) + '</div>' +
            '<div class="contact-card-email">' + escapeHtml(c.email) + '</div></div>' +
          '</div>' +
          '<div class="contact-card-detail"><span>' + escapeHtml(c.company) + '</span></div>' +
          '<div class="contact-card-footer">' +
            '<span class="badge badge-' + c.status + '">' + capitalize(c.status) + '</span>' +
            '<span class="deal-value">' + formatMoney(c.dealValue) + '</span>' +
          '</div>';
        card.addEventListener("click", function () { openContactDetail(c.id); });
        board.appendChild(card);
      });
    });
  }

  // Dashboard select-all
  var selectAllDash = document.getElementById("select-all-dash");
  if (selectAllDash) {
    selectAllDash.addEventListener("change", function () {
      document.querySelectorAll("#dash-tbody .checkbox").forEach(function (cb) {
        cb.checked = selectAllDash.checked;
      });
    });
  }

  // ── Dashboard Activity & Tasks ──────────────────────
  function loadDashActivities() {
    api("GET", "/api/activities").then(function (activities) {
      var card = document.getElementById("activity-card");
      if (!card) return;
      card.innerHTML = '<h3 class="card-title">Recent Activity</h3>';
      activities.slice(0, 5).forEach(function (a) {
        var item = document.createElement("div");
        item.className = "activity-item";
        item.innerHTML =
          '<div class="activity-dot ' + a.type + '"></div>' +
          '<div><div class="activity-text">' + a.text + '</div>' +
          '<div class="activity-time">' + escapeHtml(a.time) + '</div></div>';
        card.appendChild(item);
      });
    });
  }

  function loadDashTasks() {
    api("GET", "/api/tasks").then(function (tasks) {
      var card = document.getElementById("tasks-card");
      if (!card) return;
      card.innerHTML = '<h3 class="card-title">Upcoming Tasks</h3>';
      tasks.filter(function (t) { return !t.completed; }).slice(0, 5).forEach(function (t) {
        var isOverdue = (t.due || "").toLowerCase() === "overdue";
        var item = document.createElement("div");
        item.className = "task-item";
        item.dataset.id = t.id;
        item.innerHTML =
          '<div class="task-check"></div>' +
          '<span class="task-text">' + escapeHtml(t.text) + '</span>' +
          '<span class="task-due' + (isOverdue ? " overdue" : "") + '">' + escapeHtml(t.due) + '</span>';
        card.appendChild(item);
      });
      bindDashTaskChecks();
    });
  }

  function bindDashTaskChecks() {
    document.querySelectorAll("#tasks-card .task-check").forEach(function (check) {
      check.onclick = function () {
        check.classList.toggle("checked");
        var item = check.closest(".task-item");
        if (item) {
          item.classList.toggle("completed");
          api("PATCH", "/api/tasks/" + item.dataset.id, { completed: check.classList.contains("checked") });
        }
      };
    });
  }

  // ═══════════════════════════════════════════════════════
  //  CONTACTS PAGE
  // ═══════════════════════════════════════════════════════
  var contactsFilter = "all";

  function loadContactsPage(query) {
    var url = query || (contactsFilter === "all" ? "" : "status=" + encodeURIComponent(contactsFilter));
    api("GET", "/api/contacts" + (url ? "?" + url : "")).then(function (contacts) {
      renderContactTable(contacts, "contacts-tbody");
      var footer = document.getElementById("contacts-footer");
      if (footer) footer.textContent = contacts.length + " contact" + (contacts.length !== 1 ? "s" : "");
    });
  }

  // Contacts page filter buttons
  document.querySelectorAll("#page-contacts .filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll("#page-contacts .filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      contactsFilter = btn.dataset.filter;
      loadContactsPage();
    });
  });

  // Contacts page search
  var contactsSearch = document.getElementById("contacts-search");
  var contactsSearchTimer;
  if (contactsSearch) {
    contactsSearch.addEventListener("input", function () {
      clearTimeout(contactsSearchTimer);
      contactsSearchTimer = setTimeout(function () {
        var q = contactsSearch.value.trim();
        loadContactsPage(q ? "q=" + encodeURIComponent(q) : "");
      }, 250);
    });
  }

  // Contacts page select-all
  var selectAllContacts = document.getElementById("select-all-contacts");
  if (selectAllContacts) {
    selectAllContacts.addEventListener("change", function () {
      document.querySelectorAll("#contacts-tbody .checkbox").forEach(function (cb) {
        cb.checked = selectAllContacts.checked;
      });
    });
  }

  // Contacts page export
  document.querySelectorAll(".btn-export-contacts, #btn-export").forEach(function (btn) {
    btn.addEventListener("click", exportContacts);
  });

  // ═══════════════════════════════════════════════════════
  //  SHARED: RENDER CONTACT TABLE
  // ═══════════════════════════════════════════════════════
  function renderContactTable(contacts, tbodyId) {
    var tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.innerHTML = "";

    contacts.forEach(function (c) {
      var tr = document.createElement("tr");
      tr.dataset.id = c.id;
      tr.innerHTML =
        '<td><input type="checkbox" class="checkbox"></td>' +
        '<td><div class="contact-cell">' +
          '<div class="contact-avatar" style="background:' + (c.color || "#0052cc") + '">' + getInitials(c.name) + '</div>' +
          '<div><div class="contact-name" data-id="' + c.id + '">' + escapeHtml(c.name) + '</div>' +
          '<div class="contact-email">' + escapeHtml(c.email) + '</div></div>' +
        '</div></td>' +
        '<td>' + escapeHtml(c.company) + '</td>' +
        '<td><span class="badge badge-' + c.status + '">' + capitalize(c.status) + '</span></td>' +
        '<td class="deal-value">' + formatMoney(c.dealValue) + '</td>' +
        '<td>' + escapeHtml(c.lastActivity) + '</td>' +
        '<td>' + escapeHtml(c.owner) + '</td>' +
        '<td class="row-actions">' +
          '<button class="btn-icon edit-contact-btn" data-id="' + c.id + '" title="Edit">&#9998;</button>' +
          '<button class="btn-icon danger delete-contact-btn" data-id="' + c.id + '" title="Delete">&#128465;</button>' +
        '</td>';
      tbody.appendChild(tr);
    });

    // Bind click events
    tbody.querySelectorAll(".contact-name").forEach(function (el) {
      el.addEventListener("click", function () { openContactDetail(el.dataset.id); });
    });
    tbody.querySelectorAll(".edit-contact-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { openEditContact(btn.dataset.id); });
    });
    tbody.querySelectorAll(".delete-contact-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { confirmDelete("contact", btn.dataset.id); });
    });
  }

  // ═══════════════════════════════════════════════════════
  //  CONTACT DETAIL PANEL
  // ═══════════════════════════════════════════════════════
  var detailOverlay = document.getElementById("detail-overlay");
  var currentDetailId = null;

  function openContactDetail(id) {
    currentDetailId = id;
    api("GET", "/api/contacts/" + id).then(function (c) {
      if (!c || c.error) { toast("Contact not found", "error"); return; }
      document.getElementById("detail-name").textContent = c.name;
      var body = document.getElementById("detail-body");
      body.innerHTML =
        '<div class="detail-row"><div class="contact-avatar" style="background:' + (c.color || "#0052cc") + ';width:64px;height:64px;font-size:24px;margin:0 auto 16px;">' + getInitials(c.name) + '</div></div>' +
        detailField("Email", c.email) +
        detailField("Company", c.company) +
        detailField("Status", capitalize(c.status)) +
        detailField("Deal Value", formatMoney(c.dealValue)) +
        detailField("Owner", c.owner) +
        detailField("Last Activity", c.lastActivity);
      detailOverlay.classList.add("open");
    });
  }

  function detailField(label, value) {
    return '<div class="detail-row"><div class="detail-label">' + label + '</div><div class="detail-value">' + escapeHtml(value || "—") + '</div></div>';
  }

  document.getElementById("detail-close").addEventListener("click", function () {
    detailOverlay.classList.remove("open");
  });
  detailOverlay.addEventListener("click", function (e) {
    if (e.target === detailOverlay) detailOverlay.classList.remove("open");
  });
  document.getElementById("detail-edit-btn").addEventListener("click", function () {
    detailOverlay.classList.remove("open");
    if (currentDetailId) openEditContact(currentDetailId);
  });
  document.getElementById("detail-delete-btn").addEventListener("click", function () {
    detailOverlay.classList.remove("open");
    if (currentDetailId) confirmDelete("contact", currentDetailId);
  });

  // ═══════════════════════════════════════════════════════
  //  CONTACT MODAL (Create / Edit)
  // ═══════════════════════════════════════════════════════
  var contactModal = document.getElementById("contact-modal");
  var contactForm = document.getElementById("contact-form");
  var editingContactId = null;

  // Open new contact modal
  document.querySelectorAll("#btn-new-contact, .btn-open-new-contact").forEach(function (btn) {
    btn.addEventListener("click", function () {
      editingContactId = null;
      document.getElementById("contact-modal-title").textContent = "New Contact";
      document.getElementById("contact-form-submit").textContent = "Add Contact";
      contactForm.reset();
      contactModal.classList.add("open");
    });
  });

  function openEditContact(id) {
    api("GET", "/api/contacts/" + id).then(function (c) {
      if (!c || c.error) { toast("Contact not found", "error"); return; }
      editingContactId = id;
      document.getElementById("contact-modal-title").textContent = "Edit Contact";
      document.getElementById("contact-form-submit").textContent = "Save Changes";
      document.getElementById("cf-name").value = c.name;
      document.getElementById("cf-email").value = c.email;
      document.getElementById("cf-company").value = c.company || "";
      document.getElementById("cf-status").value = c.status;
      document.getElementById("cf-dealvalue").value = c.dealValue || 0;
      document.getElementById("cf-owner").value = c.owner || "";
      contactModal.classList.add("open");
    });
  }

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = {
      name: document.getElementById("cf-name").value.trim(),
      email: document.getElementById("cf-email").value.trim(),
      company: document.getElementById("cf-company").value.trim(),
      status: document.getElementById("cf-status").value,
      dealValue: Number(document.getElementById("cf-dealvalue").value) || 0,
      owner: document.getElementById("cf-owner").value.trim(),
    };
    if (!data.name || !data.email) return;

    if (editingContactId) {
      api("PUT", "/api/contacts/" + editingContactId, data).then(function () {
        toast("Contact updated", "success");
        addNotification("Contact " + data.name + " was updated");
        closeModal(contactModal);
        refreshCurrentPage();
      });
    } else {
      api("POST", "/api/contacts", data).then(function () {
        toast("Contact created", "success");
        addNotification("New contact " + data.name + " was added");
        closeModal(contactModal);
        refreshCurrentPage();
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  //  DEALS PAGE
  // ═══════════════════════════════════════════════════════
  function loadDealsPage() {
    api("GET", "/api/deals").then(function (deals) {
      var tbody = document.getElementById("deals-tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      deals.forEach(function (d) {
        var tr = document.createElement("tr");
        tr.dataset.id = d.id;
        tr.innerHTML =
          '<td><span style="font-weight:600">' + escapeHtml(d.title) + '</span></td>' +
          '<td>' + escapeHtml(d.company) + '</td>' +
          '<td class="deal-value">' + formatMoney(d.value) + '</td>' +
          '<td><span class="badge badge-' + stageBadge(d.stage) + '">' + capitalize(d.stage) + '</span></td>' +
          '<td>' + escapeHtml(d.date) + '</td>' +
          '<td class="row-actions">' +
            '<button class="btn-icon danger delete-deal-btn" data-id="' + d.id + '" title="Delete">&#128465;</button>' +
          '</td>';
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll(".delete-deal-btn").forEach(function (btn) {
        btn.addEventListener("click", function () { confirmDelete("deal", btn.dataset.id); });
      });
    });
  }

  function stageBadge(stage) {
    var map = { qualified: "lead", proposal: "prospect", negotiation: "churned", won: "customer" };
    return map[stage] || "lead";
  }

  // ═══════════════════════════════════════════════════════
  //  DEAL MODAL
  // ═══════════════════════════════════════════════════════
  var dealModal = document.getElementById("deal-modal");
  var dealForm = document.getElementById("deal-form");

  document.querySelectorAll("#btn-new-deal, .btn-open-new-deal").forEach(function (btn) {
    btn.addEventListener("click", function () {
      dealForm.reset();
      dealModal.classList.add("open");
    });
  });

  dealForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = {
      title: document.getElementById("df-title").value.trim(),
      company: document.getElementById("df-company").value.trim(),
      value: Number(document.getElementById("df-value").value) || 0,
      stage: document.getElementById("df-stage").value,
    };
    if (!data.title || !data.company) return;

    api("POST", "/api/deals", data).then(function () {
      toast("Deal created", "success");
      addNotification("New deal '" + data.title + "' was created");
      closeModal(dealModal);
      refreshCurrentPage();
    });
  });

  // ═══════════════════════════════════════════════════════
  //  PIPELINE PAGE
  // ═══════════════════════════════════════════════════════
  var stageNames = ["qualified", "proposal", "negotiation", "won"];

  function loadPipelinePage() {
    api("GET", "/api/deals/pipeline").then(function (pipeline) {
      var container = document.getElementById("pipeline-board");
      if (!container) return;
      container.innerHTML = "";

      stageNames.forEach(function (stage) {
        var deals = pipeline[stage] || [];
        var total = deals.reduce(function (s, d) { return s + d.value; }, 0);
        var col = document.createElement("div");
        col.className = "pipeline-col";
        col.dataset.stage = stage;

        col.innerHTML =
          '<div class="pipeline-header">' +
            '<span class="pipeline-title">' + capitalize(stage) + '</span>' +
            '<span class="pipeline-count">' + deals.length + '</span>' +
          '</div>' +
          '<div class="pipeline-total">' + formatMoney(total) + ' total</div>';

        deals.forEach(function (d) {
          var card = document.createElement("div");
          card.className = "pipeline-card";
          card.setAttribute("draggable", "true");
          card.dataset.id = d.id;
          card.innerHTML =
            '<div class="pipeline-card-title">' + escapeHtml(d.title) + '</div>' +
            '<div class="pipeline-card-company">' + escapeHtml(d.company) + '</div>' +
            '<div class="pipeline-card-footer">' +
              '<span class="pipeline-card-value">' + formatMoney(d.value) + '</span>' +
              '<span>' + escapeHtml(d.date) + '</span>' +
            '</div>';
          col.appendChild(card);
        });

        container.appendChild(col);
      });

      bindPipelineDragDrop();
    });
  }

  function bindPipelineDragDrop() {
    var cards = document.querySelectorAll("#pipeline-board .pipeline-card");
    var cols = document.querySelectorAll("#pipeline-board .pipeline-col");

    cards.forEach(function (card) {
      card.addEventListener("dragstart", function (e) {
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", card.dataset.id);
      });
      card.addEventListener("dragend", function () {
        card.classList.remove("dragging");
        cols.forEach(function (col) { col.classList.remove("drag-over"); });
      });
    });

    cols.forEach(function (col) {
      col.addEventListener("dragover", function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        col.classList.add("drag-over");
      });
      col.addEventListener("dragleave", function () { col.classList.remove("drag-over"); });
      col.addEventListener("drop", function (e) {
        e.preventDefault();
        col.classList.remove("drag-over");
        var dealId = e.dataTransfer.getData("text/plain");
        var dragging = document.querySelector('.pipeline-card[data-id="' + dealId + '"]');
        if (dragging) {
          col.appendChild(dragging);
          var newStage = col.dataset.stage;
          // Update counts & totals
          document.querySelectorAll("#pipeline-board .pipeline-col").forEach(function (c) {
            var cnt = c.querySelectorAll(".pipeline-card").length;
            var badge = c.querySelector(".pipeline-count");
            if (badge) badge.textContent = cnt;
          });
          if (newStage) {
            api("PATCH", "/api/deals/" + dealId + "/stage", { stage: newStage }).then(function () {
              toast("Deal moved to " + capitalize(newStage), "success");
              // Refresh totals
              loadPipelinePage();
            });
          }
        }
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  //  TASKS PAGE
  // ═══════════════════════════════════════════════════════
  var taskFilter = "all";

  function loadTasksPage() {
    api("GET", "/api/tasks").then(function (tasks) {
      var filtered = tasks;
      if (taskFilter === "pending") filtered = tasks.filter(function (t) { return !t.completed; });
      else if (taskFilter === "completed") filtered = tasks.filter(function (t) { return t.completed; });

      var list = document.getElementById("tasks-list");
      if (!list) return;
      list.innerHTML = "";

      if (filtered.length === 0) {
        list.innerHTML = '<div style="padding:16px;text-align:center;color:#6b778c;">No tasks found</div>';
        return;
      }

      filtered.forEach(function (t) {
        var isOverdue = (t.due || "").toLowerCase() === "overdue";
        var item = document.createElement("div");
        item.className = "task-item" + (t.completed ? " completed" : "");
        item.dataset.id = t.id;
        item.innerHTML =
          '<div class="task-check' + (t.completed ? " checked" : "") + '"></div>' +
          '<span class="task-text">' + escapeHtml(t.text) + '</span>' +
          '<span class="task-due' + (isOverdue && !t.completed ? " overdue" : "") + '">' + escapeHtml(t.due) + '</span>' +
          '<span class="task-delete" title="Delete">&#10005;</span>';
        list.appendChild(item);
      });

      bindTaskPageEvents();
    });
  }

  function bindTaskPageEvents() {
    document.querySelectorAll("#tasks-list .task-check").forEach(function (check) {
      check.onclick = function () {
        check.classList.toggle("checked");
        var item = check.closest(".task-item");
        if (item) {
          item.classList.toggle("completed");
          var completed = check.classList.contains("checked");
          api("PATCH", "/api/tasks/" + item.dataset.id, { completed: completed });
        }
      };
    });
    document.querySelectorAll("#tasks-list .task-delete").forEach(function (btn) {
      btn.onclick = function () {
        var item = btn.closest(".task-item");
        if (item) {
          api("DELETE", "/api/tasks/" + item.dataset.id).then(function () {
            item.remove();
            toast("Task deleted", "success");
            updateBadges();
          });
        }
      };
    });
  }

  // Task filter buttons
  document.querySelectorAll(".task-filters .filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".task-filters .filter-btn").forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      taskFilter = btn.dataset.tfilter;
      loadTasksPage();
    });
  });

  // Add task form
  var addTaskForm = document.getElementById("add-task-form");
  if (addTaskForm) {
    addTaskForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = document.getElementById("new-task-text").value.trim();
      var due = document.getElementById("new-task-due").value.trim();
      if (!text) return;

      api("POST", "/api/tasks", { text: text, due: due || "No date" }).then(function () {
        toast("Task added", "success");
        addNotification("New task: " + text);
        addTaskForm.reset();
        loadTasksPage();
        updateBadges();
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  //  ACTIVITIES PAGE
  // ═══════════════════════════════════════════════════════
  function loadActivitiesPage() {
    api("GET", "/api/activities").then(function (activities) {
      var container = document.getElementById("full-activity-list");
      if (!container) return;
      container.innerHTML = "";

      if (activities.length === 0) {
        container.innerHTML = '<div style="padding:16px;text-align:center;color:#6b778c;">No activity yet</div>';
        return;
      }

      activities.forEach(function (a) {
        var item = document.createElement("div");
        item.className = "activity-item";
        item.innerHTML =
          '<div class="activity-dot ' + a.type + '"></div>' +
          '<div><div class="activity-text">' + a.text + '</div>' +
          '<div class="activity-time">' + escapeHtml(a.time) + '</div></div>';
        container.appendChild(item);
      });
    });
  }

  // ═══════════════════════════════════════════════════════
  //  CONFIRM DELETE MODAL
  // ═══════════════════════════════════════════════════════
  var confirmModal = document.getElementById("confirm-modal");
  var confirmYes = document.getElementById("confirm-yes");
  var confirmText = document.getElementById("confirm-text");
  var deleteTarget = { type: null, id: null };

  function confirmDelete(type, id) {
    deleteTarget = { type: type, id: id };
    confirmText.textContent = "Are you sure you want to delete this " + type + "? This cannot be undone.";
    confirmModal.classList.add("open");
  }

  confirmYes.addEventListener("click", function () {
    var t = deleteTarget;
    closeModal(confirmModal);
    if (t.type === "contact") {
      api("DELETE", "/api/contacts/" + t.id).then(function () {
        toast("Contact deleted", "success");
        addNotification("A contact was deleted");
        refreshCurrentPage();
      });
    } else if (t.type === "deal") {
      api("DELETE", "/api/deals/" + t.id).then(function () {
        toast("Deal deleted", "success");
        addNotification("A deal was deleted");
        refreshCurrentPage();
      });
    }
  });

  // ═══════════════════════════════════════════════════════
  //  EXPORT
  // ═══════════════════════════════════════════════════════
  function exportContacts() {
    api("GET", "/api/contacts").then(function (contacts) {
      var headers = ["Name", "Email", "Company", "Status", "Deal Value", "Owner"];
      var rows = contacts.map(function (c) {
        return [c.name, c.email, c.company, c.status, c.dealValue, c.owner]
          .map(function (v) { return '"' + String(v || "").replace(/"/g, '""') + '"'; })
          .join(",");
      });
      var csv = headers.join(",") + "\n" + rows.join("\n");
      var blob = new Blob([csv], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "crm-contacts.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast("Contacts exported to CSV", "success");
    });
  }

  // ═══════════════════════════════════════════════════════
  //  SIDEBAR BADGES
  // ═══════════════════════════════════════════════════════
  function updateBadges() {
    api("GET", "/api/contacts").then(function (c) {
      var el = document.getElementById("badge-contacts");
      if (el) el.textContent = c.length;
    });
    api("GET", "/api/deals").then(function (d) {
      var el = document.getElementById("badge-deals");
      if (el) el.textContent = d.length;
    });
    api("GET", "/api/tasks").then(function (t) {
      var pending = t.filter(function (tk) { return !tk.completed; }).length;
      var el = document.getElementById("badge-tasks");
      if (el) el.textContent = pending;
    });
  }

  // ═══════════════════════════════════════════════════════
  //  MODAL HELPERS
  // ═══════════════════════════════════════════════════════
  function closeModal(modal) {
    if (modal) modal.classList.remove("open");
  }

  // Close buttons
  document.querySelectorAll(".modal-close-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var modal = btn.closest(".modal-overlay");
      closeModal(modal);
    });
  });

  // Click outside modal
  document.querySelectorAll(".modal-overlay").forEach(function (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal(overlay);
    });
  });

  // Escape key closes modals and detail panel
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay.open").forEach(function (m) { closeModal(m); });
      detailOverlay.classList.remove("open");
      if (notifDropdown) notifDropdown.classList.remove("open");
    }
  });

  // ═══════════════════════════════════════════════════════
  //  REFRESH HELPER
  // ═══════════════════════════════════════════════════════
  function refreshCurrentPage() {
    navigateTo(currentPage);
  }

  // ═══════════════════════════════════════════════════════
  //  BOOT
  // ═══════════════════════════════════════════════════════
  navigateTo("dashboard");

});
