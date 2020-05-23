/* global */

import {Character} from "../Character.js";
import {Panel} from "./Panel.js";
import {Utils} from "../Utils.js";

export class JobsPanel extends Panel {

  // constructor (pKey) {
  //   super(pKey);
  // }

  onShow (cnt) {
    const runnerJobsListJobsPromise = this.api.getRunnerJobsListJobs();
    const runnerJobsActivePromise = this.api.getRunnerJobsActive();

    runnerJobsListJobsPromise.then((pRunnerJobsListJobsData) => {
      this._handleRunnerJobsListJobs(pRunnerJobsListJobsData, cnt);
      runnerJobsActivePromise.then((pRunnerJobsActiveData) => {
        this._handleRunnerJobsActive(pRunnerJobsActiveData);
        return true;
      }, (pRunnerJobsActiveMsg) => {
        this._handleRunnerJobsActive(JSON.stringify(pRunnerJobsActiveMsg));
        return false;
      });
      return true;
    }, (pRunnerJobsListJobsMsg) => {
      this._handleRunnerJobsListJobs(JSON.stringify(pRunnerJobsListJobsMsg));
      return false;
    });
  }

  startRunningJobs () {
    const runnerJobsActivePromise = this.api.getRunnerJobsActive();

    runnerJobsActivePromise.then((pRunnerJobsActiveData) => {
      this._handleRunnerJobsActive(pRunnerJobsActiveData);
      return true;
    }, (pRunnerJobsActiveMsg) => {
      this._handleRunnerJobsActive(JSON.stringify(pRunnerJobsActiveMsg));
      return false;
    });
  }

  _handleRunnerJobsActive (pData) {
    if (!pData) {
      return;
    }

    const tbody = this.table.tBodies[0];

    if (typeof pData !== "object") {
      // update all jobs (page) with the error message
      for (const tr of tbody.rows) {
        const statusField = tr.querySelector("span.no-job-status");
        if (!statusField) {
          continue;
        }
        statusField.classList.remove("no-job-status");
        statusField.innerText = "(error)";
        Utils.addToolTip(statusField, pData);
      }
      return;
    }

    const jobs = pData.return[0];

    // update all running jobs
    for (const jobId in jobs) {
      const job = jobs[jobId];

      let targetText = "";
      const targetField = this.table.querySelector("tr#" + Utils.getIdFromJobId(jobId) + " span.job-status");
      const maxTextLength = 50;
      if (targetText.length > maxTextLength) {
        // prevent column becoming too wide
        // yes, the addition of running/returned may again make
        // the string longer than 50 characters, we accept that
        targetText = targetText.substring(0, maxTextLength) + "...";
      }
      // then add the operational statistics
      if (job.Running && job.Running.length > 0) {
        targetText += job.Running.length + " running";
      }
      if (job.Returned && job.Returned.length > 0) {
        targetText += ", " + job.Returned.length + " returned";
      }

      // the field may not (yet) be on the screen
      if (!targetField) {
        continue;
      }
      targetField.classList.remove("no-job-status");
      targetField.innerText = targetText;
      targetField.insertBefore(Utils.createJobStatusSpan(jobId, true), targetField.firstChild);
      Utils.addToolTip(targetField, "Click to refresh column");
    }

    // update all finished jobs (page)
    for (const tr of tbody.rows) {
      const statusField = tr.querySelector("span.no-job-status");
      if (!statusField) {
        continue;
      }
      statusField.classList.remove("no-job-status");
      statusField.innerText = "done";
      // we show the tooltip here so that the user is invited to click on this
      // the user then sees other rows being updated without becoming invisible
      Utils.addToolTip(statusField, "Click to refresh column");
    }
  }

  _handleRunnerJobsListJobs (pData, pMaxNumberOfJobs = 7) {
    if (this.showErrorRowInstead(pData)) {
      return;
    }

    const jobs = JobsPanel._jobsToArray(pData.return[0]);
    JobsPanel._sortJobs(jobs);

    // collect the list of hidden minions
    const hideJobsText = Utils.getStorageItem("session", "hide_jobs", "[]");
    this._hideJobs = JSON.parse(hideJobsText);
    if (!Array.isArray(this._hideJobs)) {
      this._hideJobs = [];
    }
    // collect the list of hidden minions
    const showJobsText = Utils.getStorageItem("session", "show_jobs", "[]");
    this._showJobs = JSON.parse(showJobsText);
    if (!Array.isArray(this._showJobs)) {
      this._showJobs = [];
    }

    // These jobs are likely started by the SaltGUI
    // do not display them
    this._hideJobs.push("beacons.add");
    this._hideJobs.push("beacons.delete");
    this._hideJobs.push("beacons.disable");
    this._hideJobs.push("beacons.disable_beacon");
    this._hideJobs.push("beacons.enable");
    this._hideJobs.push("beacons.enable_beacon");
    this._hideJobs.push("beacons.list");
    this._hideJobs.push("beacons.modify");
    this._hideJobs.push("beacons.reset");
    this._hideJobs.push("beacons.save");
    this._hideJobs.push("grains.append");
    this._hideJobs.push("grains.delkey");
    this._hideJobs.push("grains.delval");
    this._hideJobs.push("grains.items");
    this._hideJobs.push("grains.setval");
    this._hideJobs.push("mine.get");
    this._hideJobs.push("mine.valid");
    this._hideJobs.push("pillar.items");
    this._hideJobs.push("pillar.obfuscate");
    this._hideJobs.push("ps.kill_pid");
    this._hideJobs.push("ps.proc_info");
    this._hideJobs.push("runner.jobs.active");
    this._hideJobs.push("runner.jobs.list_job");
    this._hideJobs.push("runner.jobs.list_jobs");
    this._hideJobs.push("test.providers");
    this._hideJobs.push("test.version");
    this._hideJobs.push("saltutil.find_job");
    this._hideJobs.push("saltutil.kill_job");
    this._hideJobs.push("saltutil.refresh_grains");
    this._hideJobs.push("saltutil.refresh_pillar");
    this._hideJobs.push("saltutil.running");
    this._hideJobs.push("saltutil.signal_job");
    this._hideJobs.push("saltutil.term_job");
    this._hideJobs.push("schedule.add");
    this._hideJobs.push("schedule.delete");
    this._hideJobs.push("schedule.disable");
    this._hideJobs.push("schedule.disable_job");
    this._hideJobs.push("schedule.enable");
    this._hideJobs.push("schedule.enable_job");
    this._hideJobs.push("schedule.list");
    this._hideJobs.push("schedule.modify");
    this._hideJobs.push("schedule.run_job");
    this._hideJobs.push("sys.doc");
    this._hideJobs.push("wheel.config.values");
    this._hideJobs.push("wheel.key.accept");
    this._hideJobs.push("wheel.key.delete");
    this._hideJobs.push("wheel.key.finger");
    this._hideJobs.push("wheel.key.list_all");
    this._hideJobs.push("wheel.key.reject");

    let numberOfJobsShown = 0;
    let numberOfJobsEligible = 0;
    const numberOfJobsPresent = jobs.length;
    for (const job of jobs) {

      if (!this._hideJobs.includes(job.Function) ||
         this._showJobs.includes(job.Function)) {
        numberOfJobsEligible += 1;
      } else if (pMaxNumberOfJobs !== 99999) {
        continue;
      }

      // Add only <pMaxNumberOfJobs> most recent jobs
      if (numberOfJobsShown >= pMaxNumberOfJobs) {
        continue;
      }

      // Note that "addJob" has a specialized version
      // in each of the subclasses
      this.addJob(job);

      numberOfJobsShown += 1;
    }

    this.numberOfJobsShown = numberOfJobsShown;
    this.numberOfJobsEligible = numberOfJobsEligible;
    this.numberOfJobsPresent = numberOfJobsPresent;

    // an intermediate timer event may have caused
    // the button to be hidden
    if (this.playButton) {
      this.playButton.style.display = "none";
    }
    if (this.pauseButton) {
      this.pauseButton.style.display = "";
    }
    this.playOrPause = "play";

    this.updateFooter();
  }

  updateFooter () {
    let txt = Utils.txtZeroOneMany(this.numberOfJobsShown,
      "No jobs shown", "{0} job shown", "{0} jobs shown");
    txt += Utils.txtZeroOneMany(this.numberOfJobsEligible,
      "", ", {0} job eligible", ", {0} jobs eligible");
    txt += Utils.txtZeroOneMany(this.numberOfJobsPresent,
      "", ", {0} job present", ", {0} jobs present");

    if (this.playOrPause === "pause") {
      txt += ", press '" + Character.CH_PLAY_MONO + "' to continue";
    }

    this.setMsg(txt);
  }

  static _jobsToArray (jobs) {
    const keys = Object.keys(jobs);
    const newArray = [];

    for (const key of keys) {
      const job = jobs[key];
      job.id = key;
      newArray.push(job);
    }

    return newArray;
  }

  static _sortJobs (jobs) {
    jobs.sort((aa, bb) => {
      // The id is already a string value based on the date,
      // let's use it to sort the jobs
      /* eslint-disable curly */
      if (aa.id < bb.id) return 1;
      if (aa.id > bb.id) return -1;
      /* eslint-enable curly */
      return 0;
    });
  }

  handleSaltJobRetEvent (pData) {

    // ignore the most common events until someone complains
    if (pData.fun === "saltutil.find_job") {
      return;
    }
    if (pData.fun === "saltutil.running") {
      return;
    }

    // { fun_args: […], jid: "20190704194624366796", return: true, retcode: 0, success: true, cmd: "_return", fun: "test.rand_sleep", id: "autobuild-it-4092", _stamp: "2019-07-04T17:46:28.448689" }
    const jid = pData.jid;
    if (!jid) {
      return;
    }

    let newLevel = 0;
    if (pData.success === true && pData.retcode === 0) {
      newLevel = 1;
    } else if (pData.success === true) {
      newLevel = 2;
    } else {
      newLevel = 3;
    }

    // This element only exists when the user happens to look at the output of that jobId.
    const spans = this.div.querySelectorAll("#status" + jid);
    for (const span of spans) {
      let oldLevel = span.dataset.level;
      if (oldLevel === undefined) {
        oldLevel = 0;
      }
      if (newLevel > oldLevel) {
        span.dataset.level = newLevel;
        if (newLevel === 1) {
          span.style.color = "green";
        } else if (newLevel === 2) {
          span.style.color = "orange";
        } else if (newLevel === 3) {
          span.style.color = "red";
        }
      }
      span.style.removeProperty("display");
    }
  }
}
