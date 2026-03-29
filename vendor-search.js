(function () {
  "use strict";

  var DATA_PATH = "data/compliance-vendors.json";
  var QUERY_KEYS = {
    search: "q",
    segment: "segment",
    location: "location",
    framework: "framework",
    assurance: "assurance",
    employee: "employee",
    years: "years",
  };

  var refs = {
    searchInput: document.getElementById("search-input"),
    segmentFilter: document.getElementById("segment-filter"),
    locationFilter: document.getElementById("location-filter"),
    frameworkFilter: document.getElementById("framework-filter"),
    assuranceFilter: document.getElementById("assurance-filter"),
    employeeFilter: document.getElementById("employee-filter"),
    yearsFilter: document.getElementById("years-filter"),
    resetButton: document.getElementById("reset-filters"),
    resultsGrid: document.getElementById("results-grid"),
    resultsCount: document.getElementById("results-count"),
    statusLine: document.getElementById("status-line"),
    freshnessLine: document.getElementById("freshness-line"),
    sourceLine: document.getElementById("source-line"),
    methodLine: document.getElementById("method-line"),
    vendorCountPill: document.getElementById("vendor-count-pill"),
    frameworkCountPill: document.getElementById("framework-count-pill"),
    segmentCountPill: document.getElementById("segment-count-pill"),
  };

  var state = {
    records: [],
    filtered: [],
  };

  function readUrlState() {
    var params = new URLSearchParams(window.location.search);
    return {
      search: params.get(QUERY_KEYS.search) || "",
      segment: params.get(QUERY_KEYS.segment) || "any",
      location: params.get(QUERY_KEYS.location) || "any",
      framework: params.get(QUERY_KEYS.framework) || "any",
      assurance: params.get(QUERY_KEYS.assurance) || "any",
      employee: params.get(QUERY_KEYS.employee) || "any",
      years: params.get(QUERY_KEYS.years) || "any",
    };
  }

  function setSelectValue(select, value, fallbackValue) {
    var nextValue = value || fallbackValue;
    var exists = Array.prototype.some.call(select.options, function (option) {
      return option.value === nextValue;
    });
    select.value = exists ? nextValue : fallbackValue;
  }

  function applyUrlState(urlState) {
    refs.searchInput.value = urlState.search || "";
    setSelectValue(refs.segmentFilter, urlState.segment, "any");
    setSelectValue(refs.locationFilter, urlState.location, "any");
    setSelectValue(refs.frameworkFilter, urlState.framework, "any");
    setSelectValue(refs.assuranceFilter, urlState.assurance, "any");
    setSelectValue(refs.employeeFilter, urlState.employee, "any");
    setSelectValue(refs.yearsFilter, urlState.years, "any");
  }

  function syncUrlState() {
    var params = new URLSearchParams();
    var searchValue = refs.searchInput.value.trim();

    if (searchValue) {
      params.set(QUERY_KEYS.search, searchValue);
    }
    if (refs.segmentFilter.value !== "any") {
      params.set(QUERY_KEYS.segment, refs.segmentFilter.value);
    }
    if (refs.locationFilter.value !== "any") {
      params.set(QUERY_KEYS.location, refs.locationFilter.value);
    }
    if (refs.frameworkFilter.value !== "any") {
      params.set(QUERY_KEYS.framework, refs.frameworkFilter.value);
    }
    if (refs.assuranceFilter.value !== "any") {
      params.set(QUERY_KEYS.assurance, refs.assuranceFilter.value);
    }
    if (refs.employeeFilter.value !== "any") {
      params.set(QUERY_KEYS.employee, refs.employeeFilter.value);
    }
    if (refs.yearsFilter.value !== "any") {
      params.set(QUERY_KEYS.years, refs.yearsFilter.value);
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

  function uniqueSorted(values) {
    var seen = new Set();
    var output = [];
    values.forEach(function (value) {
      if (!value || seen.has(value)) {
        return;
      }
      seen.add(value);
      output.push(value);
    });
    return output.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function formatCount(value) {
    return new Intl.NumberFormat("en-US").format(Number(value || 0));
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
      if (!value || existing.has(value)) {
        return;
      }
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function yearsMatch(record, filterValue) {
    if (filterValue === "any") {
      return true;
    }
    var years = Number(record.years_running || 0);
    if (filterValue === "0-2") {
      return years <= 2;
    }
    if (filterValue === "3-5") {
      return years >= 3 && years <= 5;
    }
    if (filterValue === "6-10") {
      return years >= 6 && years <= 10;
    }
    if (filterValue === "11+") {
      return years >= 11;
    }
    return true;
  }

  function buildSearchableText(record) {
    if (record._searchableText) {
      return record._searchableText;
    }

    var parts = [
      record.company_name,
      record.segment,
      record.summary,
      record.location_label,
      String(record.founded_year || ""),
      String(record.years_running || ""),
      String(record.employees_estimate || ""),
    ];

    (record.customer_frameworks || []).forEach(function (item) {
      parts.push(item);
    });
    (record.public_assurance || []).forEach(function (item) {
      parts.push(item);
    });
    (record.signals || []).forEach(function (item) {
      parts.push(item);
    });
    (record.search_tags || []).forEach(function (item) {
      parts.push(item);
    });

    record._searchableText = parts.join(" ").toLowerCase();
    return record._searchableText;
  }

  function applyFilters() {
    var query = refs.searchInput.value.trim().toLowerCase();
    var segmentValue = refs.segmentFilter.value;
    var locationValue = refs.locationFilter.value;
    var frameworkValue = refs.frameworkFilter.value;
    var assuranceValue = refs.assuranceFilter.value;
    var employeeValue = refs.employeeFilter.value;
    var yearsValue = refs.yearsFilter.value;

    state.filtered = state.records.filter(function (record) {
      if (segmentValue !== "any" && record.segment !== segmentValue) {
        return false;
      }
      if (locationValue !== "any" && record.location_label !== locationValue) {
        return false;
      }
      if (frameworkValue !== "any" && record.customer_frameworks.indexOf(frameworkValue) === -1) {
        return false;
      }
      if (assuranceValue !== "any" && record.public_assurance.indexOf(assuranceValue) === -1) {
        return false;
      }
      if (employeeValue !== "any" && record.employee_band !== employeeValue) {
        return false;
      }
      if (!yearsMatch(record, yearsValue)) {
        return false;
      }
      if (query && buildSearchableText(record).indexOf(query) === -1) {
        return false;
      }
      return true;
    });

    state.filtered.sort(function (a, b) {
      return (a.company_name || "").localeCompare(b.company_name || "");
    });
  }

  function chip(label, tone) {
    return (
      '<span class="status-badge ' +
      escapeHtml(tone || "neutral") +
      '">' +
      escapeHtml(label) +
      "</span>"
    );
  }

  function renderChipList(values, tone, emptyLabel) {
    if (!values || values.length === 0) {
      return '<div class="vendor-empty-note">' + escapeHtml(emptyLabel || "Not listed") + "</div>";
    }
    return (
      '<div class="vendor-chip-list">' +
      values
        .map(function (value) {
          return chip(value, tone);
        })
        .join("") +
      "</div>"
    );
  }

  function renderLinks(record) {
    if (!record.source_links || record.source_links.length === 0) {
      return '<span class="vendor-empty-note">No public links</span>';
    }
    return (
      '<div class="auditor-link-list">' +
      record.source_links
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

  function shortUrl(url) {
    if (!url) {
      return "Not listed";
    }
    try {
      return new URL(url).host.replace(/^www\./, "");
    } catch (error) {
      return url;
    }
  }

  function renderMetaItem(label, value) {
    return (
      '<div class="vendor-meta-item">' +
      "<dt>" +
      escapeHtml(label) +
      "</dt>" +
      "<dd>" +
      escapeHtml(value) +
      "</dd>" +
      "</div>"
    );
  }

  function renderCard(record) {
    return (
      '<article class="section-card vendor-card">' +
      '<div class="vendor-card-head">' +
      '<div class="vendor-card-top">' +
      '<div class="vendor-card-title-block">' +
      '<span class="segment-badge">' +
      escapeHtml(record.segment || "Vendor") +
      "</span>" +
      "<h3>" +
      escapeHtml(record.company_name || "Unknown vendor") +
      "</h3>" +
      "</div>" +
      '<div class="vendor-stat-stack">' +
      '<div class="vendor-stat"><span>Years</span><strong>' +
      escapeHtml(String(record.years_running || 0)) +
      "</strong></div>" +
      '<div class="vendor-stat"><span>Employees</span><strong>' +
      escapeHtml(formatCount(record.employees_estimate || 0)) +
      "</strong></div>" +
      "</div>" +
      "</div>" +
      '<p class="vendor-summary">' +
      escapeHtml(record.summary || "No public summary captured.") +
      "</p>" +
      "</div>" +
      '<dl class="vendor-meta-grid">' +
      renderMetaItem("Founded", String(record.founded_year || "Not listed")) +
      renderMetaItem("Headquarters", record.location_label || "Not listed") +
      renderMetaItem("Employee band", record.employee_band || "Not listed") +
      renderMetaItem("Website", shortUrl(record.website_url)) +
      "</dl>" +
      '<div class="vendor-chip-section">' +
      '<span class="vendor-section-label">Customer frameworks</span>' +
      renderChipList(record.customer_frameworks || [], "neutral", "No customer-framework list captured.") +
      "</div>" +
      '<div class="vendor-chip-section">' +
      '<span class="vendor-section-label">Vendor public assurance</span>' +
      renderChipList(
        record.public_assurance || [],
        "yes",
        "No public assurance captured in the current source set."
      ) +
      "</div>" +
      '<div class="vendor-chip-section">' +
      '<span class="vendor-section-label">Operating signals</span>' +
      renderChipList(record.signals || [], "source", "No operating signals listed.") +
      "</div>" +
      '<div class="vendor-chip-section">' +
      '<span class="vendor-section-label">Source links</span>' +
      renderLinks(record) +
      "</div>" +
      "</article>"
    );
  }

  function renderResults() {
    if (state.filtered.length === 0) {
      refs.resultsGrid.innerHTML =
        '<article class="section-card vendor-card vendor-card--empty">' +
        "<p>No vendors match your current filters.</p>" +
        '<div class="card-actions">' +
        '<a class="pill" href="data/compliance-vendors.json">Inspect raw records</a>' +
        '<a class="pill" href="competitive-landscape.html">Read the prose view</a>' +
        "</div>" +
        "</article>";
      refs.resultsCount.textContent = "0 results";
      refs.statusLine.textContent = "No matching vendors.";
      return;
    }

    refs.resultsGrid.innerHTML = state.filtered.map(renderCard).join("");
    refs.resultsCount.textContent =
      formatCount(state.filtered.length) + " result" + (state.filtered.length === 1 ? "" : "s");

    var segmentCounts = {};
    state.filtered.forEach(function (record) {
      segmentCounts[record.segment] = (segmentCounts[record.segment] || 0) + 1;
    });
    var breakdown = Object.keys(segmentCounts)
      .sort()
      .map(function (segment) {
        return segment + ": " + formatCount(segmentCounts[segment]);
      })
      .join(" | ");

    refs.statusLine.textContent = "Showing all matching vendors." + (breakdown ? " " + breakdown : "");
  }

  function refresh(options) {
    applyFilters();
    renderResults();
    if (!options || options.updateUrl !== false) {
      syncUrlState();
    }
  }

  function wireEvents() {
    [
      refs.searchInput,
      refs.segmentFilter,
      refs.locationFilter,
      refs.frameworkFilter,
      refs.assuranceFilter,
      refs.employeeFilter,
      refs.yearsFilter,
    ].forEach(function (element) {
      element.addEventListener("input", function () {
        refresh();
      });
      element.addEventListener("change", function () {
        refresh();
      });
    });

    refs.resetButton.addEventListener("click", function () {
      refs.searchInput.value = "";
      refs.segmentFilter.value = "any";
      refs.locationFilter.value = "any";
      refs.frameworkFilter.value = "any";
      refs.assuranceFilter.value = "any";
      refs.employeeFilter.value = "any";
      refs.yearsFilter.value = "any";
      refresh();
    });

    window.addEventListener("popstate", function () {
      applyUrlState(readUrlState());
      refresh({ updateUrl: false });
    });
  }

  function renderMetadata(metadata) {
    refs.vendorCountPill.textContent = formatCount(metadata.vendor_count || 0) + " vendors";
    refs.frameworkCountPill.textContent =
      formatCount(metadata.framework_count || 0) + " tracked frameworks";
    refs.segmentCountPill.textContent =
      formatCount(metadata.segment_count || 0) + " market segments";
    refs.freshnessLine.textContent = "Last refreshed: " + formatTimestamp(metadata.generated_at);
    refs.sourceLine.textContent =
      "Sources: " + (Array.isArray(metadata.source_types) ? metadata.source_types.join(", ") : "Public sources");
    refs.methodLine.textContent =
      "Refresh target: " +
      escapeHtml(metadata.refresh_target || "Not listed") +
      ". Employee counts are approximate public-profile figures.";
  }

  function populateFilters(records) {
    populateSelect(
      refs.segmentFilter,
      uniqueSorted(
        records.map(function (record) {
          return record.segment;
        })
      )
    );
    populateSelect(
      refs.locationFilter,
      uniqueSorted(
        records.map(function (record) {
          return record.location_label;
        })
      )
    );
    populateSelect(
      refs.frameworkFilter,
      uniqueSorted(
        records.reduce(function (all, record) {
          return all.concat(record.customer_frameworks || []);
        }, [])
      )
    );
    populateSelect(
      refs.assuranceFilter,
      uniqueSorted(
        records.reduce(function (all, record) {
          return all.concat(record.public_assurance || []);
        }, [])
      )
    );
  }

  function loadData() {
    fetch(DATA_PATH)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load vendor dataset.");
        }
        return response.json();
      })
      .then(function (payload) {
        var metadata = payload.metadata || {};
        state.records = Array.isArray(payload.records) ? payload.records : [];
        populateFilters(state.records);
        renderMetadata(metadata);
        applyUrlState(readUrlState());
        wireEvents();
        refresh({ updateUrl: false });
      })
      .catch(function (error) {
        refs.resultsGrid.innerHTML =
          '<article class="section-card vendor-card vendor-card--empty">' +
          "<p>Unable to load vendor dataset.</p>" +
          '<div class="card-actions">' +
          '<a class="pill" href="data/compliance-vendors.json">Inspect raw records</a>' +
          '<a class="pill" href="competitive-landscape.html">Read the prose view</a>' +
          "</div>" +
          "</article>";
        refs.resultsCount.textContent = "0 results";
        refs.statusLine.textContent = error && error.message ? error.message : "Unable to load dataset.";
        refs.freshnessLine.textContent = "Last refreshed: unavailable";
        refs.sourceLine.textContent = "Sources: unavailable";
        refs.methodLine.textContent = "Method: unavailable";
      });
  }

  loadData();
})();
