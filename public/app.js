document.addEventListener("DOMContentLoaded", function () {

  // ── Helpers ─────────────────────────────────────────
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function initials(name) {
    return name.split(" ").map(function (w) { return w[0]; }).join("").toUpperCase().slice(0, 2);
  }

  function formatMoney(n) {
    return "$" + Number(n).toLocaleString();
  }

  // ── Load data from API ──────────────────────────────
  function loadContacts(query) {
    var url = "/api/contacts";
    if (query) url += "?" + query;
    return fetch(url).then(function (r) { return r.json(); });
  }

  function loadDeals() {
    return fetch("/api/deals/pipeline").then(function (r) { return r.json(); });
  }

  function loadTasks() {
    return fetch("/api/tasks").then(function (r) { return r.json(); });
  }

  function loadActivities() {
    return fetch("/api/activities").then(function (r) { return r.json(); });
  }

  // ── Render: Contacts Table ──────────────────────────
  function renderContacts(contacts) {
    var tbody = document.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    contacts.forEach(function (c) {
      var badgeClass = "badge-" + c.status;
      var statusLabel = c.status.charAt(0).toUpperCase() + c.status.slice(1);
      var tr = document.createElement("tr");
      tr.dataset.id = c.id;
      tr.innerHTML =
        '<td><input type="checkbox" class="checkbox"></td>' +
        '<td><div class="contact-cell">' +
          '<div class="contact-avatar" style="background:' + (c.color || "#0052cc") + '">' + initials(c.name) + '</div>' +
          '<div><div class="contact-name">' + escapeHtml(c.name) + '</div>' +
          '<div class="contact-email">' + escapeHtml(c.email) + '</div></div>' +
        '</div></td>' +
        '<td>' + escapeHtml(c.company) + '</td>' +
        '<td><span class="badge ' + badgeClass + '">' + statusLabel + '</span></td>' +
        '<td class="deal-value">' + formatMoney(c.dealValue) + '</td>' +
        '<td>' + escapeHtml(c.lastActivity) + '</td>' +
        '<td>' + escapeHtml(c.owner) + '</td>';
      tbody.appendChild(tr);
    });

    bindRowCheckboxes();
  }

  // ── Render: Pipeline ────────────────────────────────
  var stageNames = ["qualified", "proposal", "negotiation", "won"];

  function renderPipeline(pipeline) {
    var container = document.querySelector(".pipeline");
    if (!container) return;
    container.innerHTML = "";

    stageNames.forEach(function (stage) {
      var deals = pipeline[stage] || [];
      var col = document.createElement("div");
      col.className = "pipeline-col";
      col.dataset.stage = stage;

      col.innerHTML =
        '<div class="pipeline-header">' +
          '<span class="pipeline-title">' + stage.charAt(0).toUpperCase() + stage.slice(1) + '</span>' +
          '<span class="pipeline-count">' + deals.length + '</span>' +
        '</div>';

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

    bindDragAndDrop();
  }

  // ── Render: Tasks ───────────────────────────────────
  function renderTasks(tasks) {
    var container = document.querySelector(".card:last-child");
    if (!container) return;
    var title = container.querySelector(".card-title");
    container.innerHTML = "";
    if (title) container.appendChild(title);

    tasks.forEach(function (t) {
      var item = document.createElement("div");
      item.className = "task-item" + (t.completed ? " completed" : "");
      item.dataset.id = t.id;

      var isOverdue = t.due.toLowerCase() === "overdue";
      var dueClass = isOverdue ? "task-due overdue" : "task-due";

      item.innerHTML =
        '<div class="task-check' + (t.completed ? " checked" : "") + '"></div>' +
        '<span>' + escapeHtml(t.text) + '</span>' +
        '<span class="' + dueClass + '">' + escapeHtml(t.due) + '</span>';
      container.appendChild(item);
    });

    bindTaskChecks();
  }

  // ── Render: Activities ──────────────────────────────
  function renderActivities(activities) {
    var cards = document.querySelectorAll(".two-col .card");
    var container = cards[0];
    if (!container) return;
    var title = container.querySelector(".card-title");
    container.innerHTML = "";
    if (title) container.appendChild(title);

    activities.forEach(function (a) {
      var item = document.createElement("div");
      item.className = "activity-item";
      item.innerHTML =
        '<div class="activity-dot ' + a.type + '"></div>' +
        '<div>' +
          '<div class="activity-text">' + a.text + '</div>' +
          '<div class="activity-time">' + escapeHtml(a.time) + '</div>' +
        '</div>';
      container.appendChild(item);
    });
  }

  // ── Initial Load ────────────────────────────────────
  function loadAll() {
    loadContacts().then(renderContacts);
    loadDeals().then(renderPipeline);
    loadTasks().then(renderTasks);
    loadActivities().then(renderActivities);
  }

  loadAll();

  // ── Sidebar Navigation ──────────────────────────────
  var sidebarLinks = document.querySelectorAll(".sidebar-link");
  sidebarLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      sidebarLinks.forEach(function (l) { l.classList.remove("active"); });
      link.classList.add("active");
    });
  });

  // ── Filter Buttons ──────────────────────────────────
  var filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var filter = btn.textContent.trim().toLowerCase();
      var query = filter === "all" ? "" : "status=" + encodeURIComponent(filter);
      loadContacts(query).then(renderContacts);
    });
  });

  // ── View Toggle ─────────────────────────────────────
  var viewBtns = document.querySelectorAll(".view-toggle button");
  viewBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      viewBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
    });
  });

  // ── Select-All Checkbox ─────────────────────────────
  function bindRowCheckboxes() {
    var selectAll = document.querySelector("thead .checkbox");
    var rowCheckboxes = document.querySelectorAll("tbody .checkbox");
    if (selectAll) {
      selectAll.onchange = function () {
        rowCheckboxes.forEach(function (cb) { cb.checked = selectAll.checked; });
      };
    }
  }

  // ── Search Bar ──────────────────────────────────────
  var searchInput = document.querySelector(".topbar-search");
  var searchTimer;
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () {
        var q = searchInput.value.trim();
        var query = q ? "q=" + encodeURIComponent(q) : "";
        loadContacts(query).then(renderContacts);
      }, 250);
    });
  }

  // ── Task Checkboxes ─────────────────────────────────
  function bindTaskChecks() {
    var taskChecks = document.querySelectorAll(".task-check");
    taskChecks.forEach(function (check) {
      check.onclick = function () {
        check.classList.toggle("checked");
        var taskItem = check.closest(".task-item");
        if (taskItem) {
          taskItem.classList.toggle("completed");
          var id = taskItem.dataset.id;
          var completed = check.classList.contains("checked");
          fetch("/api/tasks/" + id, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ completed: completed }),
          });
        }
      };
    });
  }

  // ── Drag & Drop ─────────────────────────────────────
  function bindDragAndDrop() {
    var cards = document.querySelectorAll(".pipeline-card");
    var cols = document.querySelectorAll(".pipeline-col");

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

      col.addEventListener("dragleave", function () {
        col.classList.remove("drag-over");
      });

      col.addEventListener("drop", function (e) {
        e.preventDefault();
        col.classList.remove("drag-over");
        var dealId = e.dataTransfer.getData("text/plain");
        var dragging = document.querySelector('.pipeline-card[data-id="' + dealId + '"]');
        if (dragging) {
          col.appendChild(dragging);
          // Update count badges
          document.querySelectorAll(".pipeline-col").forEach(function (c) {
            var count = c.querySelectorAll(".pipeline-card").length;
            var badge = c.querySelector(".pipeline-count");
            if (badge) badge.textContent = count;
          });
          // Persist stage change
          var newStage = col.dataset.stage;
          if (newStage) {
            fetch("/api/deals/" + dealId + "/stage", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ stage: newStage }),
            });
          }
        }
      });
    });
  }

  // ── New Contact Modal ───────────────────────────────
  var newContactBtn = document.querySelector(".btn-primary");
  var modalOverlay = document.getElementById("new-contact-modal");

  if (newContactBtn && modalOverlay) {
    var closeBtn = modalOverlay.querySelector(".modal-close");
    var cancelBtn = modalOverlay.querySelector(".btn-secondary");
    var form = modalOverlay.querySelector("#new-contact-form");

    newContactBtn.addEventListener("click", function () {
      modalOverlay.classList.add("open");
    });

    function closeModal() {
      modalOverlay.classList.remove("open");
    }

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = form.querySelector("#contact-name").value.trim();
        var email = form.querySelector("#contact-email").value.trim();
        var company = form.querySelector("#contact-company").value.trim();
        var status = form.querySelector("#contact-status").value;

        if (!name || !email) return;

        fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name, email: email, company: company, status: status }),
        })
          .then(function (r) { return r.json(); })
          .then(function () {
            loadContacts().then(renderContacts);
            form.reset();
            closeModal();
          });
      });
    }
  }

});
