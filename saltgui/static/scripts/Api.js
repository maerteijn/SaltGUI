/* global config EventSource window */

import {CommandBox} from "./CommandBox.js";
import {Page} from "./pages/Page.js";
import {Utils} from "./Utils.js";

export class HTTPError extends Error {
  constructor (pStatus, pMessage) {
    super();
    this.status = pStatus;
    this.message = pMessage;
  }
}

export class API {
  login (pUserName, pPassWord, pEauth = "pam") {
    const params = {
      "eauth": pEauth,
      "password": pPassWord,
      "username": pUserName
    };

    // store it as the default login method
    Utils.setStorageItem("local", "eauth", pEauth);

    return this.apiRequest("POST", "/login", params).
      then((pLoginData) => {
        const response = pLoginData.return[0];
        if (Object.keys(response.perms).length === 0) {
          // We are allowed to login but there are no permissions available
          // This may happen e.g. for accounts that are in PAM,
          // but not in the 'master' file.
          // Don't give the user an empty screen full of errors
          // just like 403 Unauthorized
          throw new HTTPError(-1, "No permissions");
        }
        Utils.setStorageItem("session", "login-response", JSON.stringify(response));
        Utils.setStorageItem("session", "token", response.token);
        return true;
      });
  }

  static _cleanStorage () {
    // clear local storage except key 'eauth'
    const eauth = Utils.getStorageItem("local", "eauth");
    Utils.clearStorage("local");
    Utils.setStorageItem("local", "eauth", eauth);

    // clear all of session storage
    Utils.clearStorage("session");
  }

  logout () {
    // only delete the session here as the router should take care of
    // redirecting to the login screen
    return this.apiRequest("POST", "/logout", {}).
      then(() => {
        // we could logout, assume the session is terminated
        API._cleanStorage();
        return true;
      }, () => {
        // we could not logout, assume the session is broken
        API._cleanStorage();
        return false;
      });
  }

  getStaticMinionsTxt () {
    return this.apiRequest("GET", "/static/minions.txt");
  }

  getLocalBeaconsList (pMinionId) {
    const params = {
      "client": "local",
      "fun": "beacons.list",
      "kwarg": {"return_yaml": false}
    };
    if (pMinionId) {
      params["tgt_type"] = "list";
      params.tgt = pMinionId;
    } else {
      params["tgt_type"] = "glob";
      params.tgt = "*";
    }
    return this.apiRequest("POST", "/", params);
  }

  getLocalGrainsItems (pMinionId) {
    const params = {
      "client": "local",
      "fun": "grains.items"
    };
    if (pMinionId) {
      params["tgt_type"] = "list";
      params.tgt = pMinionId;
    } else {
      params["tgt_type"] = "glob";
      params.tgt = "*";
    }
    return this.apiRequest("POST", "/", params);
  }

  getLocalPillarItems (pMinionId) {
    const params = {
      "client": "local",
      "fun": "pillar.items"
    };
    if (pMinionId) {
      params["tgt_type"] = "list";
      params.tgt = pMinionId;
    } else {
      params["tgt_type"] = "glob";
      params.tgt = "*";
    }
    return this.apiRequest("POST", "/", params);
  }

  getLocalPillarObfuscate (pMinionId) {
    const params = {
      "client": "local",
      "fun": "pillar.obfuscate"
    };
    if (pMinionId) {
      params["tgt_type"] = "list";
      params.tgt = pMinionId;
    } else {
      params["tgt_type"] = "glob";
      params.tgt = "*";
    }
    return this.apiRequest("POST", "/", params);
  }

  getLocalScheduleList (pMinionId) {
    const params = {
      "client": "local",
      "fun": "schedule.list",
      "kwarg": {"return_yaml": false}
    };
    if (pMinionId) {
      params["tgt_type"] = "list";
      params.tgt = pMinionId;
    } else {
      params["tgt_type"] = "glob";
      params.tgt = "*";
    }
    return this.apiRequest("POST", "/", params);
  }

  getLocalTestProviders () {
    const params = {
      "client": "local",
      "fun": "test.providers",
      "tgt": "*"
    };
    return this.apiRequest("POST", "/", params);
  }

  getRunnerJobsActive () {
    const params = {
      "client": "runner",
      "fun": "jobs.active"
    };
    return this.apiRequest("POST", "/", params);
  }

  getRunnerJobsListJob (pJobId) {
    const params = {
      "client": "runner",
      "fun": "jobs.list_job",
      "jid": pJobId
    };
    return this.apiRequest("POST", "/", params);
  }

  getRunnerJobsListJobs () {
    const params = {
      "client": "runner",
      "fun": "jobs.list_jobs"
    };
    return this.apiRequest("POST", "/", params);
  }

  getRunnerManageVersions () {
    const params = {
      "client": "runner",
      "fun": "manage.versions"
    };
    return this.apiRequest("POST", "/", params);
  }

  getWheelConfigValues () {
    const params = {
      "client": "wheel",
      "fun": "config.values"
    };
    return this.apiRequest("POST", "/", params);
  }

  getWheelKeyFinger (pMinionId) {
    const params = {
      "client": "wheel",
      "fun": "key.finger"
    };
    if (pMinionId) {
      params.match = pMinionId;
    } else {
      params.match = "*";
    }
    return this.apiRequest("POST", "/", params);
  }

  getWheelKeyListAll () {
    const params = {
      "client": "wheel",
      "fun": "key.list_all"
    };
    return this.apiRequest("POST", "/", params);
  }

  getWheelMinionsConnected () {
    const params = {
      "client": "wheel",
      "fun": "minions.connected"
    };
    return this.apiRequest("POST", "/", params);
  }

  getStats () {
    const params = {
    };
    return this.apiRequest("GET", "/stats", params);
  }

  apiRequest (pMethod, pPage, pParams) {
    const url = config.API_URL + pPage;
    const token = Utils.getStorageItem("session", "token", "");
    const headers = {
      "Accept": "application/json",
      "Cache-Control": "no-cache",
      "X-Auth-Token": token
    };
    if (pPage.endsWith(".txt")) {
      headers["Accept"] = "text/plain";
    }
    const options = {
      "headers": headers,
      "method": pMethod,
      "url": url
    };

    if (pMethod === "POST") {
      options.body = JSON.stringify(pParams);
    }

    /* eslint-disable compat/compat */
    /* fetch is not supported in op_mini all, IE 11 */
    return window.fetch(url, options).
    /* eslint-enable compat/compat */
      then((pResponse) => {
        if (pResponse.ok && pPage.endsWith(".txt")) {
          return pResponse.text();
        }
        if (pResponse.ok) {
          return pResponse.json();
        }
        // fetch does not reject on > 300 http status codes,
        // so let's do it ourselves
        if (pResponse.status === 401 && pPage === "/logout") {
          // so we can't logout?
          API._cleanStorage();
          return null;
        }
        if (pResponse.status === 401 && pPage !== "/login") {
          const loginResponseStr = Utils.getStorageItem("session", "login-response");
          if (!loginResponseStr) {
            this.logout().then(() => {
              this.router.goTo("login", {"reason": "no-session"});
              return true;
            }, () => {
              this.router.goTo("login", {"reason": "no-session"});
              return false;
            });
          }

          const loginResponse = JSON.parse(loginResponseStr);
          // just in case...
          if (loginResponse) {
            const now = Date.now() / 1000;
            const expireValue = loginResponse.expire;
            if (now > expireValue) {
              this.logout().then(() => {
                this.router.goTo("login", {"reason": "expired-session"});
                return true;
              }, () => {
                this.router.goTo("login", {"reason": "expired-session"});
                return false;
              });
            }
          }
        }
        if (pResponse.status === 404 && pPage.endsWith(".txt")) {
          // ok
          return "";
        }
        throw new HTTPError(pResponse.status, pResponse.statusText);
      });
  }

  static getEvents (pRouter) {
    const tokenOnSetup = Utils.getStorageItem("session", "token");
    if (!tokenOnSetup) {
      return;
    }

    // allow only one event-stream
    if (API.eventsOK) {
      return;
    }
    API.eventsOK = true;

    let source;
    try {
      /* eslint-disable compat/compat */
      source = new EventSource(config.API_URL + "/events?token=" + tokenOnSetup);
      /* eslint-enable compat/compat */
    } catch (err) {
      console.error("Cannot read the Salt-EventBus with this browser version, browser upgrade recommended");
      return;
    }
    source.onopen = () => {
      // console.info("Listening for events...");
    };
    source.onerror = () => {
      // Don't show the error
      // It appears with every page-load
      source.close();
    };
    source.onmessage = (pMessage) => {
      const tokenOnMessage = Utils.getStorageItem("session", "token");
      if (!tokenOnMessage) {
        // no token, stop the stream
        source.close();
        return;
      }

      const loginResponseStr = Utils.getStorageItem("session", "login-response");
      if (!loginResponseStr) {
        // no login details, stop the stream
        source.close();
        return;
      }
      const loginResponse = JSON.parse(loginResponseStr);
      const expireValue = loginResponse.expire;
      const now = Date.now() / 1000;
      if (now > expireValue) {
        // the regular session has expired, also stop the stream
        source.close();
        return;
      }

      const saltEvent = JSON.parse(pMessage.data);
      const tag = saltEvent.tag;
      const data = saltEvent.data;

      // erase the public key value when it is present
      // it is long and boring (so not because it is a secret)
      if (data.pub) {
        data.pub = "...";
      }

      // salt/beacon/<minion>/<beacon>/
      if (tag.startsWith("salt/beacon/")) {
        // new beacon-value is received
        pRouter.beaconsMinionPage.handleSaltBeaconEvent(tag, data);
      } else if (tag === "salt/auth") {
        // new key has been received
        pRouter.keysPage.handleSaltAuthEvent(data);
      } else if (tag === "salt/key") {
        pRouter.keysPage.handleSaltKeyEvent(data);
      } else if (tag.startsWith("salt/job/") && tag.includes("/ret/")) {
        // return value
        CommandBox.handleSaltJobRetEvent(tag, data);
        pRouter.jobPage.handleSaltJobRetEvent(data);
        Page.handleSaltJobRetEvent(data);
        pRouter.jobsPage.handleSaltJobRetEvent(data);
      } else if (tag.startsWith("salt/job/") && tag.includes("/prog/")) {
        // progress value (exists only for states)
        CommandBox.handleSaltJobProgEvent(tag, data);
      }

      pRouter.eventsPage.handleAnyEvent(tag, data);
    };
  }
}
