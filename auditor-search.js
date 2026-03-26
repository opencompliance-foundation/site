(function () {
  "use strict";

  var DATA_PATH = "data/auditors.json";
  var MAX_ROWS = 250;
  var QUERY_KEYS = {
    search: "q",
    source: "source",
    state: "state",
    signal: "signal",
    peerReviewed: "peer",
    inProgram: "program",
    recency: "recency",
    center: "center",
  };

  var refs = {
    searchInput: document.getElementById("search-input"),
    sourceFilter: document.getElementById("source-filter"),
    stateFilter: document.getElementById("state-filter"),
    signalFilter: document.getElementById("signal-filter"),
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

  var SOURCE_FILTER_LABELS = {
    aicpa: "AICPA only",
    ukas: "UKAS only",
    pcaob: "PCAOB only",
    anab: "ANAB only",
    fedramp: "FedRAMP only",
  };

  function readUrlState() {
    var params = new URLSearchParams(window.location.search);
    return {
      search: params.get(QUERY_KEYS.search) || "",
      source: params.get(QUERY_KEYS.source) || "any",
      state: params.get(QUERY_KEYS.state) || "any",
      signal: params.get(QUERY_KEYS.signal) || "any",
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
    setSelectValue(refs.signalFilter, urlState.signal, "any");
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
    if (refs.signalFilter.value !== "any") {
      params.set(QUERY_KEYS.signal, refs.signalFilter.value);
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
      option.textContent = SOURCE_FILTER_LABELS[source.source_key] || source.source_label;
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
    if (record._searchableText) {
      return record._searchableText;
    }

    var parts = [
      record.firm_name,
      record.reference_number,
      record.city,
      record.state,
      record.country,
      record.address,
      record.source_label,
      record.source_descriptor,
      record.record_kind_label,
      record.summary_scope,
      record.report_rating,
      record.accreditation_standard,
      record.issue_number,
      record.recency_display,
      record.recency_label,
    ];

    (record.scope_lines || []).forEach(function (line) {
      parts.push(line);
    });
    (record.filter_tags || []).forEach(function (tag) {
      parts.push(tag);
    });
    (record.center_memberships || []).forEach(function (center) {
      parts.push(center);
    });
    (record.status_chips || []).forEach(function (chip) {
      parts.push(typeof chip === "string" ? chip : chip.label);
    });
    (record.standards || []).forEach(function (standard) {
      parts.push(standard);
    });
    (record.website_urls || []).forEach(function (url) {
      parts.push(url);
    });

    record._searchableText = parts.join(" ").toLowerCase();
    return record._searchableText;
  }

  function applyFilters() {
    var query = refs.searchInput.value.trim().toLowerCase();
    var sourceValue = refs.sourceFilter.value;
    var stateValue = refs.stateFilter.value;
    var signalValue = refs.signalFilter.value;
    var peerReviewedValue = refs.peerReviewedFilter.value;
    var inProgramValue = refs.inProgramFilter.value;
    var recencyValue = refs.recencyFilter.value;
    var centerValue = refs.centerFilter.value;

    state.filtered = state.records.filter(function (record) {
      var jurisdiction = record.jurisdiction || record.state || record.country || "";
      var recordSignals = Array.isArray(record.filter_tags) ? record.filter_tags : [];

      if (sourceValue !== "any" && record.source_key !== sourceValue) {
        return false;
      }

      if (query && buildSearchableText(record).indexOf(query) === -1) {
        return false;
      }

      if (stateValue !== "any" && jurisdiction !== stateValue) {
        return false;
      }

      if (signalValue !== "any" && recordSignals.indexOf(signalValue) === -1) {
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
      return (a.firm_name || "").localeCompare(b.firm_name || "");
    });
  }

  function statusBadge(label, tone) {
    var safeTone = tone || "neutral";
    return (
      '<span class="status-badge ' +
      escapeHtml(safeTone) +
      '">' +
      escapeHtml(label) +
      "</span>"
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
    var stateLabel = record.state;
    if (record.country === "United Kingdom" && stateLabel === "UK") {
      stateLabel = "";
    }
    if (record.city) {
      locationParts.push(record.city);
    }
    if (stateLabel) {
      locationParts.push(stateLabel);
    }
    if (record.country && (record.country !== "United States" || !stateLabel)) {
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
    var chips = Array.isArray(record.status_chips) ? record.status_chips : [];
    if (!chips.length) {
      return '<span class="auditor-cell-subline">Not listed</span>';
    }
    var html = chips
      .map(function (chip) {
        if (typeof chip === "string") {
          return statusBadge(chip, "neutral");
        }
        return statusBadge(chip.label, chip.tone);
      })
      .join("");
    return '<div class="auditor-chip-list">' + html + "</div>";
  }

  function renderScope(record) {
    var lines = Array.isArray(record.scope_lines) ? record.scope_lines.filter(Boolean) : [];
    if (!lines.length) {
      return "Not listed";
    }
    var html = lines
      .map(function (line, index) {
        if (index === 0) {
          return '<strong>' + escapeHtml(truncateText(line, 170)) + "</strong>";
        }
        return '<span class="auditor-cell-subline">' + escapeHtml(truncateText(line, 170)) + "</span>";
      })
      .join("");
    return '<div class="auditor-cell-stack">' + html + "</div>";
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
    var links = Array.isArray(record.public_links) ? record.public_links : [];
    if (links.length === 0) {
      return '<span class="auditor-cell-subline">No public link</span>';
    }
    return (
      '<div class="auditor-link-list">' +
      links
        .map(function (link) {
          return (
            '<a class="auditor-link" href="' +
            escapeHtml(link.url) +
            '" target="_blank" rel="noreferrer noopener">' +
            escapeHtml(link.label) +
            "</a>"
          );
        })
        .join("") +
      "</div>"
    );
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
          escapeHtml(record.record_kind_label || "Public assurance record") +
          "</span></div></td>" +
          "<td><div class=\"auditor-cell-stack\">" +
          sourceBadge(record) +
          '<span class="auditor-cell-subline">' +
          escapeHtml(record.source_descriptor || record.source_label || "Public source") +
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
        formatCount(state.filtered.length) +
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
      refs.signalFilter,
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
      refs.signalFilter.value = "any";
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
    var excluded = Array.isArray(metadata.excluded_sources) ? metadata.excluded_sources : [];
    var sourceParts = sources.map(function (source) {
      return source.source_short_label + " (" + formatCount(source.record_count || 0) + ")";
    });
    var freshnessParts = sources.map(function (source) {
      return source.source_short_label + ": " + formatTimestamp(source.fetched_at);
    });

    refs.freshnessLine.textContent =
      "Source refresh: " +
      freshnessParts.join(" | ") +
      " | Generated: " +
      formatTimestamp(metadata.generated_at) +
      " | Target cadence: " +
      (metadata.refresh_target || "3-7 days");

    refs.sourceLine.textContent =
      "Published sources: " +
      sourceParts.join(" | ") +
      " | Total records: " +
      formatCount(metadata.record_count || 0) +
      (excluded.length
        ? " | Staged, not yet published: " +
          excluded.map(function (item) { return item.source_label; }).join(", ")
        : "");
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

        var jurisdictions = uniqueSorted(
          records.map(function (record) {
            return record.jurisdiction || record.state || record.country || "";
          })
        );
        populateSelect(refs.stateFilter, jurisdictions);

        var signals = [];
        var centers = [];
        records.forEach(function (record) {
          if (Array.isArray(record.filter_tags)) {
            record.filter_tags.forEach(function (tag) {
              signals.push(tag);
            });
          }
          if (Array.isArray(record.center_memberships)) {
            record.center_memberships.forEach(function (center) {
              centers.push(center);
            });
          }
        });
        populateSelect(refs.signalFilter, uniqueSorted(signals));
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
