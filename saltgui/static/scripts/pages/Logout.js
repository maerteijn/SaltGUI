/* global window */

import {Page} from "./Page.js";
import {Utils} from "../Utils.js";

export class LogoutPage extends Page {

  constructor (pRouter) {
    super("logout", "Logout", "", pRouter);
  }

  onRegister () {
    // don't verify for invalid sessions too often
    // this happens only when the server was reset
    window.setInterval(() => {
      this._logoutTimer();
    }, 60000);

    // verify often for an expired session that we expect
    window.setInterval(() => {
      this._updateSessionTimeoutWarning();
    }, 1000);
  }

  onShow () {
    this.api.logout().then(() => {
      this.router.goTo("login", {"reason": "logout"});
    });
  }

  _logoutTimer () {
    // are we logged in?
    const token = Utils.getStorageItem("session", "token");
    if (!token) {
      return;
    }

    // just a random lightweight api call
    // that is not bound by the api permissions
    // very old versions of /stats did not properly
    // detect invalid sessions, but that was fixed
    const statsPromise = this.api.getStats();
    // don't act in the callbacks
    // Api.apiRequest will do all the work
    statsPromise.then(() => true, () => {
      this.api.logout().then(() => {
        this.router.goTo("login", {"reason": "no-session"});
        return false;
      });
    });
  }

  _updateSessionTimeoutWarning () {
    const warning = document.getElementById("warning");

    const loginResponseStr = Utils.getStorageItem("session", "login-response", "{}");
    const loginResponse = JSON.parse(loginResponseStr);

    const expireValue = loginResponse.expire;
    if (!expireValue) {
      warning.style.display = "none";
      return;
    }

    const leftMillis = expireValue * 1000 - Date.now();

    if (leftMillis <= 0) {
      warning.style.display = "";
      warning.innerText = "Logout";
      // logout, and redirect to login screen
      this.api.logout().then(() => {
        this.router.goTo("login", {"reason": "expired-session"});
        return true;
      }, () => {
        this.router.goTo("login", {"reason": "expired-session"});
        return false;
      });
      return;
    }

    if (leftMillis > 60000) {
      // warn only in the last minute
      warning.style.display = "none";
      warning.innerText = "";
      return;
    }

    warning.style.display = "";
    const left = new Date(leftMillis).toISOString();
    if (left.startsWith("1970-01-01T")) {
      // remove the date prefix and the millisecond suffix
      warning.innerText = "Session expires in " + left.substr(11, 8);
    } else {
      // stupid fallback
      warning.innerText = "Session expires in " + leftMillis + " milliseconds";
    }
  }
}
