/* global document window */

import {API} from "./Api.js";
import {BeaconsMinionPage} from "./pages/BeaconsMinion.js";
import {BeaconsPage} from "./pages/Beacons.js";
import {Character} from "./Character.js";
import {CommandBox} from "./CommandBox.js";
import {EventsPage} from "./pages/Events.js";
import {GrainsMinionPage} from "./pages/GrainsMinion.js";
import {GrainsPage} from "./pages/Grains.js";
import {JobPage} from "./pages/Job.js";
import {JobsPage} from "./pages/Jobs.js";
import {KeysPage} from "./pages/Keys.js";
import {LoginPage} from "./pages/Login.js";
import {LogoutPage} from "./pages/Logout.js";
import {MinionsPage} from "./pages/Minions.js";
import {OptionsPage} from "./pages/Options.js";
import {OrchestrationsPage} from "./pages/Orchestrations.js";
import {PillarsMinionPage} from "./pages/PillarsMinion.js";
import {PillarsPage} from "./pages/Pillars.js";
import {ReactorsPage} from "./pages/Reactors.js";
import {SchedulesMinionPage} from "./pages/SchedulesMinion.js";
import {SchedulesPage} from "./pages/Schedules.js";
import {TemplatesPage} from "./pages/Templates.js";
import {Utils} from "./Utils.js";

export class Router {

  constructor () {
    Character.init();

    this.api = new API();
    this.api.router = this;
    this.commandbox = new CommandBox(this, this.api);
    this.pages = [];
    Router.currentPage = undefined;

    this._registerPage(new LoginPage(this));
    this._registerPage(this.minionsPage = new MinionsPage(this));
    this._registerPage(this.keysPage = new KeysPage(this));
    this._registerPage(this.grainsPage = new GrainsPage(this));
    this._registerPage(this.grainsMinionPage = new GrainsMinionPage(this));
    this._registerPage(this.schedulesPage = new SchedulesPage(this));
    this._registerPage(this.schedulesMinionPage = new SchedulesMinionPage(this));
    this._registerPage(this.pillarsPage = new PillarsPage(this));
    this._registerPage(this.pillarsMinionPage = new PillarsMinionPage(this));
    this._registerPage(this.beaconsPage = new BeaconsPage(this));
    this._registerPage(this.beaconsMinionPage = new BeaconsMinionPage(this));
    this._registerPage(this.jobPage = new JobPage(this));
    this._registerPage(this.jobsPage = new JobsPage(this));
    this._registerPage(this.templatesPage = new TemplatesPage(this));
    this._registerPage(this.eventsPage = new EventsPage(this));
    this._registerPage(this.reactorsPage = new ReactorsPage(this));
    this._registerPage(this.orchestrationsPage = new OrchestrationsPage(this));
    this._registerPage(this.optionsPage = new OptionsPage(this));
    this._registerPage(new LogoutPage(this));

    this._registerRouterEventListeners();

    Router.updateMainMenu();

    const hash = window.location.hash.replace(/^#/, "");
    const search = window.location.search;
    /* eslint-disable compat/compat */
    /* URLSearchParams.entries() is not supported in IE 11 */
    /* URLSearchParams is not supported in op_mini all, IE 11, Baidu 7.12 */
    this.goTo(hash, Object.fromEntries(new URLSearchParams(search)));
    /* eslint-enable compat/compat */
  }

  _registerMenuItem (pParentId, pButtonId, pUrl) {

    // full menu

    const fullMenuDiv = document.querySelector(".fullmenu");

    const dropDownName = pParentId || pButtonId;
    let dropDownDiv = document.getElementById("dropdown-" + dropDownName);
    if (!dropDownDiv) {
      dropDownDiv = Utils.createDiv("dropdown", "", "dropdown-" + dropDownName);
      fullMenuDiv.append(dropDownDiv);
    }

    if (pParentId) {
      let dropdownContent = document.getElementById("dropdown-content-" + pParentId);
      if (!dropdownContent) {
        dropdownContent = Utils.createDiv("dropdown-content", "", "dropdown-content-" + pParentId);
        dropDownDiv.append(dropdownContent);
      }
      const itemDiv = Utils.createDiv("run-command-button menu-item", pButtonId, "button-" + pButtonId + "1");
      dropdownContent.append(itemDiv);
    } else {
      const topItemDiv = Utils.createDiv("menu-item", pButtonId, "button-" + pButtonId + "1");
      dropDownDiv.append(topItemDiv);
    }

    // mini menu

    const miniMenuDiv = document.querySelector(".minimenu");
    const dropdownContent2 = miniMenuDiv.querySelector(".dropdown-content");
    // 00A0 = NO-BREAK SPACE
    const menuItemDiv = Utils.createDiv("run-command-button menu-item", (pParentId ? "-\u00A0" : "") + pButtonId, "button-" + pButtonId + "2");
    dropdownContent2.append(menuItemDiv);

    // activate the menu items as needed

    // conditions go inside the handler because the pages
    // data may still being retrieved at this point
    for (const nr of ["1", "2"]) {
      document.getElementById("button-" + pButtonId + nr).
        addEventListener("click", () => {
          const pages = Router._getPagesList();
          if (pUrl && (pButtonId === "logout" || pages.length === 0 || pages.includes(pButtonId))) {
            this.goTo(pUrl);
          }
        });
    }
  }

  _registerRouterEventListeners () {
    document.getElementById("logo").
      addEventListener("click", () => {
        if (window.event.ctrlKey) {
          this.goTo("options");
        } else {
          this.goTo("");
        }
      });

    addEventListener("popstate", (popstate) => {
      const hash = popstate.target.location.hash.replace(/^#/, "");
      const search = popstate.target.location.search;
      /* eslint-disable compat/compat */
      /* URLSearchParams.entries() is not supported in IE 11 */
      /* URLSearchParams is not supported in op_mini all, IE 11, Baidu 7.12 */
      this.goTo(hash, Object.fromEntries(new URLSearchParams(search)), 2);
      /* eslint-enable compat/compat */
    });

    this._registerMenuItem(null, "minions", "minions");
    this._registerMenuItem("minions", "grains", "grains");
    this._registerMenuItem("minions", "schedules", "schedules");
    this._registerMenuItem("minions", "pillars", "pillars");
    this._registerMenuItem("minions", "beacons", "beacons");
    this._registerMenuItem(null, "keys", "keys");
    this._registerMenuItem(null, "jobs", "jobs");
    this._registerMenuItem("jobs", "templates", "templates");
    this._registerMenuItem("jobs", "orchestrations", "orchestrations");
    this._registerMenuItem(null, "events", "eventsview");
    this._registerMenuItem("events", "reactors", "reactors");
    this._registerMenuItem(null, "logout", "logout");
  }

  _registerPage (pPage) {
    this.pages.push(pPage);
    if (pPage.onRegister) {
      pPage.onRegister();
    }
  }

  static _getUserName () {
    const loginResponseStr = Utils.getStorageItem("session", "login-response", "{}");
    try {
      const loginResponse = JSON.parse(loginResponseStr);
      return loginResponse.user;
    } catch (err) {
      console.error("error in object login-response=" + loginResponseStr + " --> " + err.name + ": " + err.message);
      return null;
    }
  }

  static _getPagesList () {
    const pagesText = Utils.getStorageItem("session", "pages", "{}");
    let pages;
    try {
      pages = JSON.parse(pagesText);
    } catch (err) {
      console.error("error in object saltgui_pages=" + pagesText + " --> " + err.name + ": " + err.message);
      return {};
    }
    const userName = Router._getUserName();
    if (!userName || typeof pages !== "object" || !(userName in pages)) {
      return [];
    }
    const ret = pages[userName];
    if (!ret || ret[0] === "*") {
      return [];
    }
    return ret;
  }

  static _showMenuItem (pPages, pName, pChildren = []) {
    // assume the best
    let visible = true;

    // do not show unwanted menu items
    if (pPages.length && !pPages.includes(pName)) {
      visible = false;
    }

    // force visibility of the logout menuitem
    if (pName === "logout") {
      visible = true;
    }

    // still show a menu item when a child is visible
    let hasVisibleChild = false;
    for (const page of pChildren) {
      if (pPages.includes(page)) {
        hasVisibleChild = true;
        break;
      }
    }

    // perform the hiding/showing
    for (let nr = 1; nr <= 2; nr++) {
      const item = document.getElementById("button-" + pName + nr);
      item.style.color = !visible && hasVisibleChild ? "lightgray" : "black";
      if (visible || hasVisibleChild) {
        item.classList.remove("menu-item-hidden");
      } else {
        item.classList.add("menu-item-hidden");
      }
    }

    // show orchestrations menu item if orchestrations defined
    const orchestrationsText = Utils.getStorageItem("session", "orchestrations", "");
    if (orchestrationsText) {
      const item1 = document.getElementById("button-orchestrations1");
      item1.classList.remove("menu-item-hidden");
      const item2 = document.getElementById("button-orchestrations2");
      item2.classList.remove("menu-item-hidden");
    }
  }

  static updateMainMenu () {
    const pages = Router._getPagesList();

    Router._showMenuItem(pages, "minions", ["grains", "schedules", "pillars", "beacons"]);
    Router._showMenuItem(pages, "grains");
    Router._showMenuItem(pages, "schedules");
    Router._showMenuItem(pages, "pillars");
    Router._showMenuItem(pages, "beacons");
    Router._showMenuItem(pages, "keys");
    Router._showMenuItem(pages, "jobs", ["templates"]);
    Router._showMenuItem(pages, "templates");
    Router._showMenuItem(pages, "events", ["reactors"]);
    Router._showMenuItem(pages, "reactors");
    Router._showMenuItem(pages, "logout");
  }

  // pForward = 0 --> normal navigation
  // pForward = 1 --> back navigation using regular gui
  // pForward = 2 --> back navigation using browser
  goTo (pHash, pQuery = {}, pForward = 0) {

    if (Utils.getStorageItem("session", "login-response") === null) {
      // the fact that we don't have a session will be caught later
      // but this was shows less error messages on the console
      pHash = "login";
      pQuery = {"reason": "no-session"};
    }

    const pages = Router._getPagesList();
    if (!pHash) {
      // go to the concrete default page
      if (pages.length) {
        pHash = pages[0];
      } else {
        pHash = "minions";
      }
    }

    // save the details from the parent
    const parentHash = document.location.hash.replace(/^#/, "");
    const search = window.location.search;
    /* eslint-disable compat/compat */
    /* URLSearchParams.entries() is not supported in IE 11 */
    /* URLSearchParams is not supported in op_mini all, IE 11, Baidu 7.12 */
    const parentQuery = Object.fromEntries(new URLSearchParams(search));
    /* eslint-enable compat/compat */

    for (const route of this.pages) {
      if (route.path !== pHash) {
        continue;
      }
      // push history state, so that the address bar holds the correct
      // deep-link; and so that we can use the back-button
      let url = "/";
      let sep = "?";
      for (const key in pQuery) {
        const value = pQuery[key];
        if (!value || value === "undefined") {
          continue;
        }
        url += sep + key + "=" + encodeURIComponent(value);
        sep = "&";
      }
      url += "#" + pHash;
      if (parentHash === route.path) {
        // page refresh
        // prevents being detected as "forward navigation"
        // stay on the page, but parameters may have been updated
        window.history.replaceState({}, undefined, url);
      } else if (pForward === 0) {
        // forward navigation
        window.history.pushState({}, undefined, url);
        route.parentHash = parentHash;
        route.parentQuery = parentQuery;
      } else if (pForward === 1) {
        // close-icon on a panel
        // do not save parent details
        // these were already registered on the way forward
        window.history.pushState({}, undefined, url);
      } else if (pForward === 2) {
        // backward navigation from browser
        // do nothing extra
      }
      this._showPage(route);
      return;
    }

    // route could not be found
    // just go to the main page
    if (pHash === "") {
      console.log("cannot find default page");
      return;
    }
    this.goTo("");
  }

  _showPage (pPage) {
    pPage.clearPage();

    pPage.pageElement.style.display = "";

    // de-activate all menu items
    const activeMenuItems = Array.from(document.querySelectorAll(".menu-item-active"));
    activeMenuItems.forEach((menuItem) => {
      menuItem.classList.remove("menu-item-active");
    });

    // highlight the fullmenu item
    const elem1 = document.getElementById(pPage.menuItemElement1);
    if (elem1) {
      elem1.classList.add("menu-item-active");
      const parentItem = elem1.parentElement.parentElement.firstChild;
      // activate also parent menu item if child element is selected
      if (parentItem.id.startsWith("button-")) {
        parentItem.classList.add("menu-item-active");
      }
    }

    // highlight the minimenu item
    const elem2 = document.getElementById(pPage.menuItemElement2);
    if (elem2) {
      elem2.classList.add("menu-item-active");
    }

    pPage.onShow();

    // start the event-pipe (again)
    // it is either not started, or needs restarting
    API.getEvents(this);

    if (Router.currentPage && Router.currentPage !== pPage) {
      Router._hidePage(Router.currentPage);
    }
    Router.currentPage = pPage;

    Router.currentPage.pageElement.classList.add("current");
  }

  static _hidePage (pPage) {
    const page = pPage.pageElement;
    page.classList.remove("current");
    // 500ms matches the timeout in main.css (.route)
    window.setTimeout(() => {
      // Hide element after fade, so it does not expand the body
      page.style.display = "none";
    }, 500);
    if (pPage.onHide) {
      pPage.onHide();
    }
  }
}
