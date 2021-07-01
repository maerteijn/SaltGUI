/* global */

import {JobsSummaryPanel} from "../panels/JobsSummary.js";

export class Page {

  constructor (pPath, pPageName, pMenuItemSelector, pRouter) {
    this.path = pPath;
    this.name = pPageName;

    this.router = pRouter;
    if (pMenuItemSelector) {
      this.menuItemElement1 = pMenuItemSelector + "1";
      this.menuItemElement2 = pMenuItemSelector + "2";
    }

    this.panels = [];
    this.api = pRouter.api;

    if (!Page.panels) {
      Page.panels = [];
    }
  }

  static _getIpNumberPrefixes (pAllMinionsGrains) {
    // First we gather all (resonable) prefixes
    // Only use byte-boundaries for networks
    // Must match a subnet of A, B or C network
    const prefixes = {};
    for (const minionId in pAllMinionsGrains) {
      const grains = pAllMinionsGrains[minionId];
      if (!grains.fqdn_ip4) {
        continue;
      }
      if (!Array.isArray(grains.fqdn_ip4)) {
        continue;
      }
      for (const ip of grains.fqdn_ip4) {
        const parts = ip.split(".");
        if (ip.startsWith("10.")) {
          prefixes[parts[0] + "."] = true;
        }
        if (ip.startsWith("10.") ||
           ip.startsWith("172.16.") ||
           ip.startsWith("172.17.") ||
           ip.startsWith("172.18.") ||
           ip.startsWith("172.19.") ||
           ip.startsWith("172.20.") ||
           ip.startsWith("172.21.") ||
           ip.startsWith("172.22.") ||
           ip.startsWith("172.23.") ||
           ip.startsWith("172.24.") ||
           ip.startsWith("172.25.") ||
           ip.startsWith("172.26.") ||
           ip.startsWith("172.27.") ||
           ip.startsWith("172.28.") ||
           ip.startsWith("172.29.") ||
           ip.startsWith("172.30.") ||
           ip.startsWith("172.31.") ||
           ip.startsWith("192.168.")) {
          prefixes[parts[0] + "." + parts[1] + "."] = true;
          prefixes[parts[0] + "." + parts[1] + "." + parts[2] + "."] = true;
        }
      }
    }

    // Then we look whether each minion uses the prefix
    // When at least one minion does not use the subnet,
    //    then it is not a suitable subnet
    for (const prefix in prefixes) {
      for (const minionId in pAllMinionsGrains) {
        let cnt = 0;
        const grains = pAllMinionsGrains[minionId];
        if (!grains.fqdn_ip4) {
          continue;
        }
        if (!Array.isArray(grains.fqdn_ip4)) {
          continue;
        }
        for (const ip of grains.fqdn_ip4) {
          if (!ip.startsWith(prefix)) {
            continue;
          }
          cnt += 1;
        }
        // multiple or unused?
        //    then it is not a suitable subnet
        if (cnt !== 1) {
          prefixes[prefix] = false;
          break;
        }
      }
    }

    // actually remove the unused prefixes
    for (const prefix in prefixes) {
      if (!prefixes[prefix]) {
        delete prefixes[prefix];
      }
    }

    return prefixes;
  }

  addPanel (pPanel) {
    // TODO: panels no longer exclusive for a route
    pPanel.route = this;
    pPanel.router = this.router;
    pPanel.api = this.api;
    const dashboard = document.getElementById("route-container");
    dashboard.append(pPanel.div);
    this.panels.push(pPanel);
    // prevent duplicate in the global list
    // and still keep the elements in display sequence
    Page.panels = Page.panels.filter((value) => value !== pPanel);
    Page.panels.push(pPanel);
  }

  static isVisible () {
    // a page is visible, unless the page decides otherwise
    return true;
  }

  onShow () {
    const header = document.getElementById("header");
    const dashboard = document.getElementById("route-container");
    if (this.constructor.name === "LoginPage") {
      // cannot use instanceof here due to cyclic dependency
      dashboard.style.justifyContent = "center";
      dashboard.style.alignItems = "center";
      header.style.display = "none";
    } else {
      dashboard.style.justifyContent = "initial";
      dashboard.style.alignItems = "flex-start";
      header.style.display = "";
    }
    if (this.constructor.name === "JobsPage") {
      Page.jobs.div.style.flexBasis = "100%";
    } else {
      // the left panel has the default 100%
      // therefore the ratio is 2/3 vs 1/3
      Page.jobs.div.style.flexBasis = "50%";
    }
    for (const panel of this.panels) {
      panel.onShow();
    }
  }

  clearPage () {
    for (const panel of this.panels) {
      panel.clearPanel();
    }
  }

  refreshPage () {
    for (const panel of this.panels) {
      if (!panel.needsRefresh) {
        continue;
      }
      panel.needsRefresh = false;
      panel.clearPanel();
      panel.onShow();
    }
  }

  static handleSaltJobRetEvent (pData) {
    if (Page.jobs) {
      Page.jobs.handleSaltJobRetEvent(pData);
    }
  }

  addJobsSummaryPanel () {
    if (!Page.jobs) {
      Page.jobs = new JobsSummaryPanel();
    }
    this.addPanel(Page.jobs);
  }
}
