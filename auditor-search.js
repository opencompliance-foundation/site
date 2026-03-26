(function () {
  "use strict";

  var DATA_PATH = "data/auditors.json";
  var MAX_ROWS = 250;

  var refs = {
    searchInput: document.getElementById("search-input"),
    stateFilter: document.getElementById("state-filter"),
    peerReviewedFilter: document.getElementById("peer-reviewed-filter"),
    inProgramFilter: document.getElementById("in-program-filter"),
    recencyFilter: document.getElementById("recency-filter"),
    centerFilter: document.getElementById("center-filter"),
    resetButton: document.getElementById("reset-filters"),
    statusLine: document.getElementById("status-line"),
    resultsCount: document.getElementById("results-count"),
    freshnessLine: document.getElementById("freshness-line"),
    sourceLine: document.getElementById("source-line"),
    tbody: document.getElementById("results-body"),
  };

  var state = {
    records: [],
    filtered: [],
  };

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function toDate(dateValue) {
    if (!dateValue) {
      return null;
    }
    var parts = String(dateValue).split("/");
    if (parts.length !== 3) {
      return null;
    }
    var month = Number(parts[0]);
    var day = Number(parts[1]);
    var year = Number(parts[2]);
    if (!month || !day || !year) {
      return null;
    }
    return new Date(Date.UTC(year, month - 1, day));
  }

  function monthsSince(dateValue) {
    var parsed = toDate(dateValue);
    if (!parsed) {
      return null;
    }
    var now = new Date();
    var years = now.getUTCFullYear() - parsed.getUTCFullYear();
    var months = now.getUTCMonth() - parsed.getUTCMonth();
    var totalMonths = years * 12 + months;
    if (now.getUTCDate() < parsed.getUTCDate()) {
      totalMonths -= 1;
    }
    return totalMonths < 0 ? 0 : totalMonths;
  }

  function uniqueSorted(values) {
    var seen = new Set();
    var output = [];
    values.forEach(function (item) {
      if (!item || seen.has(item)) {
        return;
      }
      seen.add(item);
      output.push(item);
    });
    return output.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function populateSelect(select, options) {
    var existing = new Set();
    for (var i = 0; i < select.options.length; i += 1) {
      existing.add(select.options[i].value);
    }
    options.forEach(function (value) {
      if (existing.has(value)) {
        return;
      }
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function recencyMatches(record, recencyValue) {
    if (recencyValue === "any") {
      return true;
    }
    var ageInMonths = monthsSince(record.peer_review_acceptance_date);
    if (recencyValue === "no-date") {
      return ageInMonths === null;
    }
    if (ageInMonths === null) {
      return false;
    }
    if (recencyValue === "12") {
      return ageInMonths <= 12;
    }
    if (recencyValue === "24") {
      return ageInMonths <= 24;
    }
    if (recencyValue === "older") {
      return ageInMonths > 24;
    }
    return true;
  }

  function boolFilterMatches(filterValue, recordValue) {
    if (filterValue === "any") {
      return true;
    }
    if (filterValue === "yes") {
      return recordValue === true;
    }
    if (filterValue === "no") {
      return recordValue === false;
    }
    return true;
  }

  function applyFilters() {
    var query = refs.searchInput.value.trim().toLowerCase();
    var stateValue = refs.stateFilter.value;
    var peerReviewedValue = refs.peerReviewedFilter.value;
    var inProgramValue = refs.inProgramFilter.value;
    var recencyValue = refs.recencyFilter.value;
    var centerValue = refs.centerFilter.value;

    state.filtered = state.records.filter(function (record) {
      if (query) {
        var searchable = [
          record.firm_name,
          record.firm_number,
          record.city,
          record.state,
        ]
          .join(" ")
          .toLowerCase();
        if (searchable.indexOf(query) === -1) {
          return false;
        }
      }

      if (stateValue && stateValue !== "any" && record.state !== stateValue) {
        return false;
      }

      if (!boolFilterMatches(peerReviewedValue, record.is_peer_reviewed)) {
        return false;
      }

      if (!boolFilterMatches(inProgramValue, record.is_in_peer_review_program)) {
        return false;
      }

      if (!recencyMatches(record, recencyValue)) {
        return false;
      }

      if (
        centerValue &&
        centerValue !== "any" &&
        (!Array.isArray(record.center_memberships) ||
          record.center_memberships.indexOf(centerValue) === -1)
      ) {
        return false;
      }

      return true;
    });

    state.filtered.sort(function (a, b) {
      var aDate = toDate(a.peer_review_acceptance_date);
      var bDate = toDate(b.peer_review_acceptance_date);
      if (aDate && bDate) {
        return bDate.getTime() - aDate.getTime();
      }
      if (aDate && !bDate) {
        return -1;
      }
      if (!aDate && bDate) {
        return 1;
      }
      return a.firm_name.localeCompare(b.firm_name);
    });
  }

  function statusBadge(value) {
    return value
      ? '<span class="status-badge yes">Yes</span>'
      : '<span class="status-badge no">No</span>';
  }

  function renderRows() {
    var rowsToShow = state.filtered.slice(0, MAX_ROWS);

    if (rowsToShow.length === 0) {
      refs.tbody.innerHTML =
        '<tr><td colspan="9" class="empty-row">No firms match your current filters.</td></tr>';
      refs.resultsCount.textContent = "0 results";
      refs.statusLine.textContent = "No matching firms.";
      return;
    }

    var html = rowsToShow
      .map(function (record) {
        var period =
          record.peer_review_period_from && record.peer_review_period_to
            ? record.peer_review_period_from + " - " + record.peer_review_period_to
            : "Not listed";
        var centers = Array.isArray(record.center_memberships) && record.center_memberships.length
          ? record.center_memberships.join(", ")
          : "None listed";
        return (
          "<tr>" +
          "<td><strong>" + escapeHtml(record.firm_name || "Unknown") + "</strong></td>" +
          "<td>" + escapeHtml(record.firm_number || "Not listed") + "</td>" +
          "<td>" + escapeHtml((record.city || "") + (record.state ? ", " + record.state : "Not listed")) + "</td>" +
          "<td>" + statusBadge(record.is_peer_reviewed) + "</td>" +
          "<td>" + statusBadge(record.is_in_peer_review_program) + "</td>" +
          "<td>" + escapeHtml(record.peer_review_acceptance_date || "Not listed") + "</td>" +
          "<td>" + escapeHtml(period) + "</td>" +
          "<td>" + escapeHtml(record.report_rating || "Not listed") + "</td>" +
          "<td>" + escapeHtml(centers) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    refs.tbody.innerHTML = html;

    refs.resultsCount.textContent =
      state.filtered.length + " result" + (state.filtered.length === 1 ? "" : "s");

    if (state.filtered.length > MAX_ROWS) {
      refs.statusLine.textContent =
        "Showing first " +
        MAX_ROWS +
        " rows of " +
        state.filtered.length +
        ". Narrow filters for a smaller set.";
    } else {
      refs.statusLine.textContent = "Showing all matching rows.";
    }
  }

  function refresh() {
    applyFilters();
    renderRows();
  }

  function wireEvents() {
    [
      refs.searchInput,
      refs.stateFilter,
      refs.peerReviewedFilter,
      refs.inProgramFilter,
      refs.recencyFilter,
      refs.centerFilter,
    ].forEach(function (el) {
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    });

    refs.resetButton.addEventListener("click", function () {
      refs.searchInput.value = "";
      refs.stateFilter.value = "any";
      refs.peerReviewedFilter.value = "any";
      refs.inProgramFilter.value = "any";
      refs.recencyFilter.value = "any";
      refs.centerFilter.value = "any";
      refresh();
    });
  }

  function renderMetadata(metadata) {
    refs.freshnessLine.textContent =
      "Last refreshed: " +
      (metadata.fetched_at || "Unknown") +
      " | Generated: " +
      (metadata.generated_at || "Unknown") +
      " | Target cadence: " +
      (metadata.refresh_target || "3-7 days");

    refs.sourceLine.textContent =
      "Source: " + (metadata.source || "AICPA Public File Search");
  }

  function load() {
    fetch(DATA_PATH, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Could not load auditor dataset.");
        }
        return response.json();
      })
      .then(function (payload) {
        var metadata = payload.metadata || {};
        var records = Array.isArray(payload.records) ? payload.records : [];

        state.records = records;
        renderMetadata(metadata);

        var states = uniqueSorted(
          records.map(function (record) {
            return record.state || "";
          })
        );
        populateSelect(refs.stateFilter, states);

        var centers = [];
        records.forEach(function (record) {
          if (Array.isArray(record.center_memberships)) {
            record.center_memberships.forEach(function (center) {
              centers.push(center);
            });
          }
        });
        populateSelect(refs.centerFilter, uniqueSorted(centers));

        wireEvents();
        refresh();
      })
      .catch(function (error) {
        refs.statusLine.textContent = "Failed to load dataset: " + error.message;
        refs.tbody.innerHTML =
          '<tr><td colspan="9" class="empty-row">Dataset unavailable.</td></tr>';
      });
  }

  load();
})();
