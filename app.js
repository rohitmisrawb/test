document.addEventListener("DOMContentLoaded", function () {

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
  var tableRows = document.querySelectorAll("tbody tr");

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");

      var filter = btn.textContent.trim().toLowerCase();
      tableRows.forEach(function (row) {
        if (filter === "all") {
          row.style.display = "";
          return;
        }
        var badge = row.querySelector(".badge");
        var status = badge ? badge.textContent.trim().toLowerCase() : "";
        // Map filter label to status: "leads" -> "lead", "customers" -> "customer", etc.
        var mapped = filter.replace(/s$/, "");
        row.style.display = status === mapped ? "" : "none";
      });
    });
  });

  // ── View Toggle (Table / Board) ─────────────────────
  var viewBtns = document.querySelectorAll(".view-toggle button");
  viewBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      viewBtns.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
    });
  });

  // ── Select-All Checkbox ─────────────────────────────
  var selectAll = document.querySelector("thead .checkbox");
  var rowCheckboxes = document.querySelectorAll("tbody .checkbox");

  if (selectAll) {
    selectAll.addEventListener("change", function () {
      rowCheckboxes.forEach(function (cb) {
        cb.checked = selectAll.checked;
      });
    });
  }

  // ── Task Checkboxes ─────────────────────────────────
  var taskChecks = document.querySelectorAll(".task-check");
  taskChecks.forEach(function (check) {
    check.addEventListener("click", function () {
      check.classList.toggle("checked");
      var taskItem = check.closest(".task-item");
      if (taskItem) {
        taskItem.classList.toggle("completed");
      }
    });
  });

  // ── Search Bar (live filter on table) ───────────────
  var searchInput = document.querySelector(".topbar-search");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      var query = searchInput.value.toLowerCase();
      tableRows.forEach(function (row) {
        var text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? "" : "none";
      });
    });
  }

  // ── Pipeline Card Drag & Drop ───────────────────────
  var pipelineCards = document.querySelectorAll(".pipeline-card");
  var pipelineCols = document.querySelectorAll(".pipeline-col");

  pipelineCards.forEach(function (card) {
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", function (e) {
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragend", function () {
      card.classList.remove("dragging");
      pipelineCols.forEach(function (col) { col.classList.remove("drag-over"); });
    });
  });

  pipelineCols.forEach(function (col) {
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
      var dragging = document.querySelector(".pipeline-card.dragging");
      if (dragging) {
        col.appendChild(dragging);
        updatePipelineCounts();
      }
    });
  });

  function updatePipelineCounts() {
    pipelineCols.forEach(function (col) {
      var count = col.querySelectorAll(".pipeline-card").length;
      var badge = col.querySelector(".pipeline-count");
      if (badge) {
        badge.textContent = count;
      }
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

        var initials = name.split(" ").map(function (w) { return w[0]; }).join("").toUpperCase().slice(0, 2);
        var colors = ["#0052cc", "#00875a", "#6554c0", "#ff991f", "#de350b"];
        var color = colors[Math.floor(Math.random() * colors.length)];

        var badgeClass = "badge-" + status.toLowerCase();
        var statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

        var tr = document.createElement("tr");
        tr.innerHTML =
          '<td><input type="checkbox" class="checkbox"></td>' +
          '<td><div class="contact-cell">' +
            '<div class="contact-avatar" style="background:' + color + '">' + initials + '</div>' +
            '<div><div class="contact-name">' + escapeHtml(name) + '</div>' +
            '<div class="contact-email">' + escapeHtml(email) + '</div></div>' +
          '</div></td>' +
          '<td>' + escapeHtml(company) + '</td>' +
          '<td><span class="badge ' + badgeClass + '">' + statusLabel + '</span></td>' +
          '<td class="deal-value">$0</td>' +
          '<td>Just now</td>' +
          '<td>—</td>';

        var tbody = document.querySelector("tbody");
        if (tbody) tbody.prepend(tr);

        form.reset();
        closeModal();
      });
    }
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

});
