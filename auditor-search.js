(function () {
  "use strict";

  var DATA_PATH = "data/auditors.json";
  var MAX_ROWS = 250;
  var QUERY_KEYS = {
    search: "q",
    source: "source",
    state: "state",
    peerReviewed: "peer",
    inProgram: "program",
    recency: "recency",
    center: "center",
  };

  var refs = {
    searchInput: document.getElementById("search-input"),
    sourceFilter: document.getElementById("source-filter"),
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
    sources: [],
  };

  function readUrlState() {
    var params = new URLSearchParams(window.location.search);
    return {
      search: params.get(QUERY_KEYS.search) || "",
      source: params.get(QUERY_KEYS.source) || "any",
      state: params.get(QUERY_KEYS.state) || "any",
      peerReviewed: params.get(QUERY_KEYS.peerReviewed) || "any",
      inProgram: params.get(QUERY_KEYS.inProgram) || "any",
      recency: params.get(QUERY_KEYS.recency) || "any",
      center: params.get(QUERY_KEYS.center) || "any",
    };
  }

  function setSelectValue(select, value, fallbackValue) {
    var nextValue = value || fallbackValue;
    var hasValue = Array.prototype.some.call(select.options, function (option) {
      return option.value === nextValue;
    });
    select.value = hasValue ? nextValue : fallbackValue;
  }

  function applyUrlState(urlState) {
    refs.searchInput.value = urlState.search || "";
    setSelectValue(refs.sourceFilter, urlState.source, "any");
    setSelectValue(refs.stateFilter, urlState.state, "any");
    setSelectValue(refs.peerReviewedFilter, urlState.peerReviewed, "any");
    setSelectValue(refs.inProgramFilter, urlState.inProgram, "any");
    setSelectValue(refs.recencyFilter, urlState.recency, "any");
    setSelectValue(refs.centerFilter, urlState.center, "any");
  }

  function syncUrlState() {
    var params = new URLSearchParams();
    var searchValue = refs.searchInput.value.trim();

    if (searchValue) {
      params.set(QUERY_KEYS.search, searchValue);
    }
    if (refs.sourceFilter.value !== "any") {
      params.set(QUERY_KEYS.source, refs.sourceFilter.value);
    }
    if (refs.stateFilter.value !== "any") {
      params.set(QUERY_KEYS.state, refs.stateFilter.value);
    }
    if (refs.peerReviewedFilter.value !== "any") {
      params.set(QUERY_KEYS.peerReviewed, refs.peerReviewedFilter.value);
    }
    if (refs.inProgramFilter.value !== "any") {
      params.set(QUERY_KEYS.inProgram, refs.inProgramFilter.value);
    }
    if (refs.recencyFilter.value !== "any") {
      params.set(QUERY_KEYS.recency, refs.recencyFilter.value);
    }
    if (refs.centerFilter.value !== "any") {
      params.set(QUERY_KEYS.center, refs.centerFilter.value);
    }

    var nextQuery = params.toString();
    var nextUrl = window.location.pathname + (nextQuery ? "?" + nextQuery : "");
    var currentUrl = window.location.pathname + window.location.search;

    if (nextUrl !== currentUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parseIsoDate(value) {
    if (!value) {
      return null;
    }
    var parsed = new Date(String(value) + "T00:00:00Z");
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function monthsSince(record) {
    var parsed = parseIsoDate(record.recency_date_iso);
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

  function formatCount(value) {
    if (typeof value !== "number") {
      return String(value || "");
    }
    return new Intl.NumberFormat("en-US").format(value);
  }

  function formatTimestamp(value) {
    if (!value) {
      return "Unknown";
    }

    var parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    var formatted = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(parsed);

    return formatted.replace(",", "") + " UTC";
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

  function populateSourceSelect(sources) {
    var existing = new Set();
    for (var i = 0; i < refs.sourceFilter.options.length; i += 1) {
      existing.add(refs.sourceFilter.options[i].value);
    }
    sources.forEach(function (source) {
      if (!source || !source.source_key || existing.has(source.source_key)) {
        return;
      }
      var option = document.createElement("option");
      option.value = source.source_key;
      option.textContent = source.source_label;
      refs.sourceFilter.appendChild(option);
    });
  }

  function recencyMatches(record, recencyValue) {
    if (recencyValue === "any") {
      return true;
    }
    var ageInMonths = monthsSince(record);
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
    if (recordValue !== true && recordValue !== false) {
      return false;
    }
    if (filterValue === "yes") {
      return recordValue === true;
    }
    if (filterValue === "no") {
      return recordValue === false;
    }
    return true;
  }

  function buildSearchableText(record) {
    var parts = [
      record.firm_name,
      record.firm_number,
      record.city,
      record.state,
      record.address,
      record.source_label,
      record.summary_scope,
      record.report_rating,
      record.accreditation_standard,
      record.issue_number,
    ];

    if (Array.isArray(record.center_memberships)) {
      record.center_memberships.forEach(function (center) {
        parts.push(center);
      });
    }
    if (Array.isArray(record.standards)) {
      record.standards.forEach(function (standard) {
        parts.push(standard);
      });
    }
    if (Array.isArray(record.website_urls)) {
      record.website_urls.forEach(function (url) {
        parts.push(url);
      });
    }

    return parts
      .join(" ")
      .toLowerCase();
  }

  function applyFilters() {
    var query = refs.searchInput.value.trim().toLowerCase();
    var sourceValue = refs.sourceFilter.value;
    var stateValue = refs.stateFilter.value;
    var peerReviewedValue = refs.peerReviewedFilter.value;
    var inProgramValue = refs.inProgramFilter.value;
    var recencyValue = refs.recencyFilter.value;
    var centerValue = refs.centerFilter.value;

    state.filtered = state.records.filter(function (record) {
      if (sourceValue !== "any" && record.source_key !== sourceValue) {
        return false;
      }

      if (query && buildSearchableText(record).indexOf(query) === -1) {
        return false;
      }

      if (stateValue !== "any" && record.state !== stateValue) {
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
        centerValue !== "any" &&
        (!Array.isArray(record.center_memberships) ||
          record.center_memberships.indexOf(centerValue) === -1)
      ) {
        return false;
      }

      return true;
    });

    state.filtered.sort(function (a, b) {
      var aDate = parseIsoDate(a.recency_date_iso);
      var bDate = parseIsoDate(b.recency_date_iso);
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
    if (value === true) {
      return '<span class="status-badge yes">Yes</span>';
    }
    if (value === false) {
      return '<span class="status-badge no">No</span>';
    }
    return '<span class="status-badge na">N/A</span>';
  }

  function statusLine(label, badgeHtml) {
    return (
      '<div class="auditor-status-line">' +
      '<span class="auditor-status-label">' + escapeHtml(label) + "</span>" +
      badgeHtml +
      "</div>"
    );
  }

  function sourceBadge(record) {
    return (
      '<span class="source-badge source-' +
      escapeHtml(record.source_key || "unknown") +
      '">' +
      escapeHtml(record.source_short_label || record.source_label || "Source") +
      "</span>"
    );
  }

  function truncateText(value, maxLength) {
    if (!value) {
      return "";
    }
    if (value.length <= maxLength) {
      return value;
    }
    return value.slice(0, maxLength - 1).trimEnd() + "\u2026";
  }

  function renderLocation(record) {
    var locationParts = [];
    if (record.city) {
      locationParts.push(record.city);
    }
    if (record.country === "United Kingdom") {
      locationParts.push("United Kingdom");
    } else if (record.state) {
      locationParts.push(record.state);
    } else if (record.country) {
      locationParts.push(record.country);
    }
    var label = locationParts.join(", ");
    if (record.address) {
      return (
        '<div class="auditor-cell-stack">' +
        (label ? '<strong>' + escapeHtml(label) + "</strong>" : "") +
        '<span class="auditor-cell-subline">' + escapeHtml(record.address) + "</span>" +
        "</div>"
      );
    }
    return escapeHtml(label || "Not listed");
  }

  function renderStatus(record) {
    if (record.source_key === "ukas") {
      return (
        '<div class="auditor-status-list">' +
        statusLine("Record type", '<span class="status-badge source">UKAS</span>') +
        statusLine("ISO 27001", statusBadge(record.has_iso_27001)) +
        statusLine("ISO 27701", statusBadge(record.has_iso_27701)) +
        "</div>"
      );
    }
    return (
      '<div class="auditor-status-list">' +
      statusLine("Peer reviewed", statusBadge(record.is_peer_reviewed)) +
      statusLine("In program", statusBadge(record.is_in_peer_review_program)) +
      "</div>"
    );
  }

  function renderScope(record) {
    if (record.source_key === "ukas") {
      var lines = [];
      if (record.accreditation_standard) {
        lines.push('<strong>' + escapeHtml(record.accreditation_standard) + "</strong>");
      }
      if (record.issue_number) {
        lines.push('<span class="auditor-cell-subline">Issue ' + escapeHtml(record.issue_number) + "</span>");
      }
      if (record.summary_scope) {
        lines.push(
          '<span class="auditor-cell-subline" title="' +
            escapeHtml(record.summary_scope) +
            '">' +
            escapeHtml(truncateText(record.summary_scope, 170)) +
            "</span>"
        );
      }
      return '<div class="auditor-cell-stack">' + lines.join("") + "</div>";
    }

    var period =
      record.peer_review_period_from && record.peer_review_period_to
        ? record.peer_review_period_from + " - " + record.peer_review_period_to
        : "";
    var centers = Array.isArray(record.center_memberships) && record.center_memberships.length
      ? record.center_memberships.join(", ")
      : "";
    var aicpaLines = [];
    if (record.report_rating) {
      aicpaLines.push('<strong>' + escapeHtml(record.report_rating) + "</strong>");
    }
    if (period) {
      aicpaLines.push('<span class="auditor-cell-subline">' + escapeHtml(period) + "</span>");
    }
    if (centers) {
      aicpaLines.push('<span class="auditor-cell-subline">Centers: ' + escapeHtml(centers) + "</span>");
    }
    if (aicpaLines.length === 0) {
      return "Not listed";
    }
    return '<div class="auditor-cell-stack">' + aicpaLines.join("") + "</div>";
  }

  function renderDate(record) {
    if (!record.recency_display) {
      return "Not listed";
    }
    return (
      '<div class="auditor-cell-stack">' +
      '<strong>' + escapeHtml(record.recency_display) + "</strong>" +
      '<span class="auditor-cell-subline">' + escapeHtml(record.recency_label || "Date") + "</span>" +
      "</div>"
    );
  }

  function renderLinks(record) {
    var links = [];
    if (record.detail_url) {
      links.push(
        '<a class="auditor-link" href="' +
          escapeHtml(record.detail_url) +
          '" target="_blank" rel="noreferrer noopener">' +
          escapeHtml(
            record.source_key === "ukas" ? "UKAS schedule" : (record.detail_label || "Source")
          ) +
          "</a>"
      );
    }
    if (record.source_url && record.source_url !== record.detail_url) {
      links.push(
        '<a class="auditor-link" href="' +
          escapeHtml(record.source_url) +
          '" target="_blank" rel="noreferrer noopener">Source</a>'
      );
    }
    if (Array.isArray(record.website_urls) && record.website_urls.length > 0) {
      links.push(
        '<a class="auditor-link" href="' +
          escapeHtml(record.website_urls[0]) +
          '" target="_blank" rel="noreferrer noopener">Website</a>'
      );
    }
    if (links.length === 0) {
      return '<span class="auditor-cell-subline">No public link</span>';
    }
    return '<div class="auditor-link-list">' + links.join("") + "</div>";
  }

  function renderRows() {
    var rowsToShow = state.filtered.slice(0, MAX_ROWS);

    if (rowsToShow.length === 0) {
      refs.tbody.innerHTML =
        '<tr><td colspan="8" class="empty-row">No records match your current filters.</td></tr>';
      refs.resultsCount.textContent = "0 results";
      refs.statusLine.textContent = "No matching records.";
      return;
    }

    var html = rowsToShow
      .map(function (record) {
        return (
          "<tr>" +
          "<td><div class=\"auditor-cell-stack\"><strong>" +
          escapeHtml(record.firm_name || "Unknown") +
          "</strong>" +
          '<span class="auditor-cell-subline">' +
          escapeHtml(record.source_key === "ukas" ? "UKAS ISMS certification body" : "AICPA peer-review firm") +
          "</span>" +
          (record.summary_scope && record.source_key === "ukas"
            ? '<span class="auditor-cell-subline">' +
              escapeHtml(truncateText(record.summary_scope, 96)) +
              "</span>"
            : "") +
          "</div></td>" +
          "<td><div class=\"auditor-cell-stack\">" +
          sourceBadge(record) +
          '<span class="auditor-cell-subline">' +
          escapeHtml(record.source_key === "ukas" ? "UKAS public register" : "AICPA public file search") +
          "</span></div></td>" +
          "<td>" + escapeHtml(record.reference_number || "Not listed") + "</td>" +
          "<td>" + renderLocation(record) + "</td>" +
          "<td>" + renderStatus(record) + "</td>" +
          "<td>" + renderScope(record) + "</td>" +
          "<td>" + renderDate(record) + "</td>" +
          "<td>" + renderLinks(record) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    refs.tbody.innerHTML = html;
    refs.resultsCount.textContent =
      state.filtered.length + " result" + (state.filtered.length === 1 ? "" : "s");

    var sourceCounts = {};
    state.filtered.forEach(function (record) {
      var key = record.source_short_label || record.source_label || "Other";
      sourceCounts[key] = (sourceCounts[key] || 0) + 1;
    });
    var breakdown = Object.keys(sourceCounts)
      .sort()
      .map(function (key) {
        return key + ": " + formatCount(sourceCounts[key]);
      })
      .join(" | ");

    if (state.filtered.length > MAX_ROWS) {
      refs.statusLine.textContent =
        "Showing first " +
        MAX_ROWS +
        " rows of " +
        state.filtered.length +
        ". Narrow filters for a smaller set." +
        (breakdown ? " " + breakdown : "");
    } else {
      refs.statusLine.textContent = "Showing all matching rows." + (breakdown ? " " + breakdown : "");
    }
  }

  function refresh(options) {
    applyFilters();
    renderRows();
    if (!options || options.updateUrl !== false) {
      syncUrlState();
    }
  }

  function wireEvents() {
    [
      refs.searchInput,
      refs.sourceFilter,
      refs.stateFilter,
      refs.peerReviewedFilter,
      refs.inProgramFilter,
      refs.recencyFilter,
      refs.centerFilter,
    ].forEach(function (el) {
      el.addEventListener("input", function () {
        refresh();
      });
      el.addEventListener("change", function () {
        refresh();
      });
    });

    refs.resetButton.addEventListener("click", function () {
      refs.searchInput.value = "";
      refs.sourceFilter.value = "any";
      refs.stateFilter.value = "any";
      refs.peerReviewedFilter.value = "any";
      refs.inProgramFilter.value = "any";
      refs.recencyFilter.value = "any";
      refs.centerFilter.value = "any";
      refresh();
    });

    window.addEventListener("popstate", function () {
      applyUrlState(readUrlState());
      refresh({ updateUrl: false });
    });
  }

  function renderMetadata(metadata) {
    var sources = Array.isArray(metadata.sources) ? metadata.sources : [];
    var sourceParts = sources.map(function (source) {
      return source.source_label + " (" + formatCount(source.record_count || 0) + ")";
    });
    var freshnessParts = sources.map(function (source) {
      return source.source_label + ": " + formatTimestamp(source.fetched_at);
    });

    refs.freshnessLine.textContent =
      "Source refresh: " +
      freshnessParts.join(" | ") +
      " | Generated: " +
      formatTimestamp(metadata.generated_at) +
      " | Target cadence: " +
      (metadata.refresh_target || "3-7 days");

    refs.sourceLine.textContent =
      "Sources: " +
      sourceParts.join(" | ") +
      " | Total records: " +
      formatCount(metadata.record_count || 0);
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
        var sources = Array.isArray(metadata.sources) ? metadata.sources : [];
        var initialUrlState = readUrlState();

        state.records = records;
        state.sources = sources;
        renderMetadata(metadata);
        populateSourceSelect(sources);

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

        applyUrlState(initialUrlState);
        wireEvents();
        refresh();
      })
      .catch(function (error) {
        refs.statusLine.textContent = "Failed to load dataset: " + error.message;
        refs.tbody.innerHTML =
          '<tr><td colspan="8" class="empty-row">Dataset unavailable.</td></tr>';
      });
  }

  load();
})();
