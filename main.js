var themes = [
  { id: "ar-js", name: "Default" },
  { id: "light-blue", name: "Light Blue" },
  { id: "green", name: "Green" },
  { id: "dark-yellow", name: "Dark Yellow" },
];

var reports = [
  { label: "Tabular", url: "/assets/tabular-report.rdlx-json" },
  { label: "Banded", url: "/assets/BandedReport.rdlx-json" },
  { label: "Summary", url: "/assets/SummaryReport.rdlx-json" },
  { label: "Drill-down", url: "/assets/DrillDownReport.rdlx-json" },
  { label: "Drill-through", url: "/assets/DrillThroughMainReport.rdlx-json" },
];

document.addEventListener("DOMContentLoaded", function () {
  // Elements
  var themesListEl = document.getElementById("themes-list");
  var reportsListEl = document.getElementById("reports-list");
  var appEl = document.getElementById("app");
  var designerHostEl = document.getElementById("arjs-designer-host");
  var viewerHostEl = document.getElementById("arjs-viewer-host");

  // Common variables
  var currentThemeIndex = 0;
  var currentReportIndex = 0;
  var reportMap = reports.slice();

  // Render themes list
  for (let index = 0; index < themes.length; index++) {
    var theme = themes[index];
    var activeClassName =
      currentThemeIndex === index ? "active gc-accent-color" : "";
    var listItem = [
      '<li data-theme-item="',
      index,
      '" class="list-item ',
      activeClassName,
      '">',
      theme.name,
      "</li>",
    ].join("");
    themesListEl.insertAdjacentHTML("beforeend", listItem);
  }

  // Render reports list
  for (let index = 0; index < reports.length; index++) {
    var report = reports[index];
    var activeClassName =
      currentReportIndex === index ? "active gc-accent-color" : "";
    var listItem = [
      '<li data-report-item="',
      index,
      '" class="list-item ',
      activeClassName,
      '">',
      report.label,
      "</li>",
    ].join("");
    reportsListEl.insertAdjacentHTML("beforeend", listItem);
  }

  // App helpers
  var helpers = {
    setMode: function (mode) {
      if (mode === "viewer") {
        designerHostEl.classList.add("hidden");
        viewerHostEl.classList.remove("hidden");
      } else {
        designerHostEl.classList.remove("hidden");
        viewerHostEl.classList.add("hidden");
      }
    },
    reportUri: function (report) {
      return report.definition
        ? { definition: report.definition, displayName: report.label }
        : { id: report.url, displayName: report.label };
    },
    selectReport: function (event, selectedReportIndex) {
      event.target.classList.add("active", "gc-accent-color");
      // reset the active list item class
      var currentListItemEl = document.querySelector(
        '[data-report-item="' + currentReportIndex + '"]'
      );
      currentListItemEl.classList.remove("active", "gc-accent-color");
      currentReportIndex = selectedReportIndex;
    },
    selectTheme: function (event, selectedThemeIndex) {
      // apply theme class
      appEl.className = "";
      appEl.classList.add(themes[selectedThemeIndex].id);
      event.target.classList.add("active", "gc-accent-color");
      // reset the active list item class
      var currentListItemEl = document.querySelector(
        '[data-theme-item="' + currentThemeIndex + '"]'
      );
      currentListItemEl.classList.remove("active", "gc-accent-color");
      currentThemeIndex = selectedThemeIndex;
    },
  };

  // App handlers
  var handlers = {
    onEditReport: function (viewer, designer) {
      var report = reportMap[currentReportIndex];
      console.info(currentReportIndex, helpers.reportUri(report));
      designer.setReport(helpers.reportUri(report));
      designer.setActionHandlers({
        onRender: function (data) {
          reportMap[currentReportIndex].definition = data.definition;
          viewer.open(data.definition);
          helpers.setMode("viewer");
          return Promise.resolve();
        },
      });
      helpers.setMode("designer");
    },
    onClickOnReportItem: function (event, viewer, designer) {
      var index = event.target.dataset.reportItem || 0;
      var report = reportMap[index];
      viewer.open(report.definition || report.url);
      designer.setReport(helpers.reportUri(report));
      helpers.selectReport(event, index);
    },
    onClickOnThemeItem: function (event) {
      var index = event.target.dataset.themeItem || 0;
      // apply a selected theme
      if (index !== 0) {
        var currentThemeStyles = document.querySelectorAll(
          ".ar-theme-" + themes[index].id
        );
        for (var i = 0; i < currentThemeStyles.length; i++) {
          currentThemeStyles[i].setAttribute("media", "all");
        }
      }
      // disable a previous selected theme
      var previousThemeStyles = document.querySelectorAll(
        ".ar-theme-" + themes[currentThemeIndex].id
      );
      for (var i = 0; i < previousThemeStyles.length; i++) {
        previousThemeStyles[i].setAttribute("media", "not all");
      }
      helpers.selectTheme(event, index);
    },
  };

  /**
   * Initialize Report Viewer component.
   */
  function initViewer(designer) {
    var viewer = new ActiveReports.Viewer("#arjs-viewer-host");
    // Adding a toolbar item
    viewer.toolbar.addItem({
      key: "$openDesigner",
      text: "Edit in Designer",
      iconCssClass: "mdi mdi-pencil",
      enabled: true,
      action: function () {
        handlers.onEditReport(viewer, designer);
      },
    });
    // Setting the toolbar layout
    viewer.toolbar.updateLayout({
      default: [
        "$openDesigner",
        "$split",
        "$navigation",
        "$split",
        "$refresh",
        "$split",
        "$history",
        "$split",
        "$zoom",
        "$fullscreen",
        "$split",
        "$print",
        "$split",
        "$singlepagemode",
        "$continuousmode",
        "$galleymode",
      ],
    });
    // Open default report
    viewer.open(reports[currentThemeIndex].url);
    return viewer;
  }

  /**
   * Initialize Report Designer component
   */
  function initDesigner() {
    return new GC.ActiveReports.ReportDesigner.Designer("#arjs-designer-host");
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners(viewer, designer) {
    // Report list listeners
    var reportListElx = document.querySelectorAll("[data-report-item]");
    for (var i = 0; i < reportListElx.length; i++) {
      reportListElx[i].addEventListener("click", function (event) {
        handlers.onClickOnReportItem(event, viewer, designer);
      });
    }
    // Theme list listeners
    var themeListElx = document.querySelectorAll("[data-theme-item]");
    for (var i = 0; i < themeListElx.length; i++) {
      themeListElx[i].addEventListener("click", handlers.onClickOnThemeItem);
    }
  }

  /**
   * Initialize app.
   */
  (function initApp() {
    var designer = initDesigner();
    var viewer = initViewer(designer);
    setupEventListeners(viewer, designer);
  })();
});
