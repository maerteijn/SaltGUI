/* global document MouseEvent window */

import {Character} from "../Character.js";
import {OutputDocumentation} from "./OutputDocumentation.js";
import {OutputHighstate} from "./OutputHighstate.js";
import {OutputJson} from "./OutputJson.js";
import {OutputNested} from "./OutputNested.js";
import {OutputToml} from "./OutputToml.js";
import {OutputYaml} from "./OutputYaml.js";
import {ParseCommandLine} from "../ParseCommandLine.js";
import {Utils} from "../Utils.js";

// Functions to turn responses from the salt system into visual information
// The following variations exist:
// A) documentation output
//    one of the responsing nodes is selected
//    all other nodes are then ignored
// B) state output
//    the response is formatted as a list of tasks
// C) error output
//    the response is formatted as text
// D) other output
//    the response is formatted as json text
//
// Additionally the following preparations may be needed:
// 1) Output from WHEEL functions
//    This output is re-organized to let it appear as if the output comes
//    from a single node called "master".
// 2) Output from RUNNERS functions
//    This output is re-organized to let it appear as if the output comes
//    from a single node called "master".


export class Output {

  static isOutputFormatAllowed (pRequestedOutputFormat) {
    const supportedOutputFormats = Utils.getStorageItem("session", "output_formats", "doc,saltguihighstate,json");
    return supportedOutputFormats.includes(pRequestedOutputFormat);
  }

  static isStateOutputSelected (pRequestedStateOutput) {
    const stateOutput = Utils.getStorageItem("session", "state_output", "full");
    return stateOutput.includes(pRequestedStateOutput);
  }

  // Re-organize the output to let it appear as if the output comes
  // from a single node called "RUNNER" or "MASTER".
  // This way all responses are organized by minion
  static _addVirtualMinion (pResponse, pCommand) {

    if (pCommand.startsWith("runners.")) {
      // Add a new level in the object
      return {"RUNNER": pResponse};
    }

    if (pCommand.startsWith("wheel.")) {
      // Add a new level in the object
      return {"WHEEL": pResponse};
    }

    // otherwise return the original
    return pResponse;
  }

  // compose the host/minion-name label that is shown with each response
  static getMinionIdHtml (pMinionId, pClassName = "") {
    const span = Utils.createSpan("minion-id", pMinionId);
    if (pClassName) {
      span.classList.add(pClassName);
    }
    return span;
  }

  // the output is only text
  // note: do not return a text-node
  static _getTextOutput (pMinionResponse) {
    // strip trailing whitespace
    pMinionResponse = pMinionResponse.replace(/[ \r\n]+$/g, "");

    // replace all returned JIDs to links
    // typically found in the output of an async job
    if (pMinionResponse.match(ParseCommandLine.getPatJid())) {
      const link = document.createElement("a");
      link.href = "?id=" + encodeURIComponent(pMinionResponse) + "#job";
      link.innerText = pMinionResponse;
      return link;
    }

    // all regular text
    const span = Utils.createSpan("", pMinionResponse);
    return span;
  }


  // format an object in the preferred style
  static formatObject (pObject) {
    if (Output.isOutputFormatAllowed("json")) {
      return OutputJson.formatJSON(pObject);
    }

    if (Output.isOutputFormatAllowed("yaml")) {
      return OutputYaml.formatYAML(pObject);
    }

    if (Output.isOutputFormatAllowed("toml")) {
      return OutputToml.formatTOML(pObject);
    }

    if (Output.isOutputFormatAllowed("nested")) {
      return OutputNested.formatNESTED(pObject);
    }

    // when nothing is allowed, JSON is always allowed
    return OutputJson.formatJSON(pObject);
  }


  // this is the default output form
  // just format the returned objects
  // note: do not return a text-node
  static _getNormalOutput (pMinionResponse) {
    const content = Output.formatObject(pMinionResponse);
    const isMultiLineString = Utils.isMultiLineString(content);
    const element = isMultiLineString ? Utils.createDiv() : Utils.createSpan();
    element.innerText = content;
    return element;
  }


  static _hasProperties (pObject, pPropArr) {
    if (!pObject || typeof pObject !== "object") {
      return false;
    }
    for (const prop of pPropArr) {
      if (pObject[prop] === undefined) {
        return false;
      }
    }
    return true;
  }


  static _isAsyncOutput (pResponse) {
    const keys = Object.keys(pResponse);
    if (keys.length !== 2) {
      return false;
    }
    keys.sort();
    if (keys[0] !== "jid") {
      return false;
    }
    if (keys[1] !== "minions") {
      return false;
    }
    return true;
  }


  // reformat a date-time string
  // supported formats:
  // (time) 19:05:01.561754
  // (datetime) 2019, Jan 26 19:05:22.808348
  // current action is (only):
  // - reduce the number of digits for the fractional seconds
  static dateTimeStr (pDtStr) {

    // no available setting, then return the original
    const dateTimeFractionDigitsText = Utils.getStorageItem("session", "datetime_fraction_digits");
    if (dateTimeFractionDigitsText === null) {
      return pDtStr;
    }

    // setting is not a number, return the original
    let dateTimeFractionDigits = Number.parseInt(dateTimeFractionDigitsText, 10);
    if (isNaN(dateTimeFractionDigits)) {
      return pDtStr;
    }

    // stick to the min/max values without complaining
    if (dateTimeFractionDigits < 0) {
      dateTimeFractionDigits = 0;
    } else if (dateTimeFractionDigits > 6) {
      dateTimeFractionDigits = 6;
    }

    // find the fractional part (assume only one '.' in the string)
    let dotPos = pDtStr.indexOf(".");
    if (dotPos < 0) {
      return pDtStr;
    }

    // with no digits, also remove the dot
    if (dateTimeFractionDigits === 0) {
      dotPos -= 1;
    }

    return pDtStr.substring(0, dotPos + dateTimeFractionDigits + 1);
  }

  static getDuration (pMilliSeconds) {
    if (pMilliSeconds < 1000) {
      return Utils.txtZeroOneMany(Math.round(pMilliSeconds),
        "{0} ms", "{0} ms", "{0} ms");
    }
    return Utils.txtZeroOneMany(Math.round(pMilliSeconds) / 1000, "", "{0} s", "{0} s");
  }

  static isHiddenTask (pTask) {
    const isStateVerbose = Utils.getStorageItem("session", "state_verbose", "true");
    /* eslint-disable curly */
    if (isStateVerbose !== "false") return false;
    if (pTask.result !== true) return false;
    if (!pTask.changes) return true;
    if (typeof pTask.changes !== "object") return false;
    if (Array.isArray(pTask.changes) && pTask.changes.length === 0) return true;
    if (Object.keys(pTask.changes).length === 0) return true;
    /* eslint-enable curly */
    return false;
  }

  static _setTaskTooltip (pSpan, pTask) {
    let txt = "";

    if ("name" in pTask) {
      txt += pTask.name;
    }

    if ("__id__" in pTask && pTask.__id__ !== pTask.name) {
      txt += "\n" + pTask.__id__;
    }

    if ("__sls__" in pTask) {
      txt += "\n" + pTask.__sls__.replace(/[.]/g, "/") + ".sls";
    }

    let nrChanges = 0;
    if (!pTask.changes) {
      // txt += "\nno changes";
    } else if (typeof pTask.changes !== "object") {
      nrChanges = 1;
      txt += "\n'changes' has type " + typeof pTask.changes;
    } else if (Array.isArray(pTask.changes)) {
      nrChanges = pTask.changes.length;
      txt += "\n'changes' is an array";
      txt += Utils.txtZeroOneMany(nrChanges, "", "\n" + nrChanges + " change", "\n" + nrChanges + " changes");
    } else {
      nrChanges = Object.keys(pTask.changes).length;
      txt += Utils.txtZeroOneMany(nrChanges, "", "\n" + nrChanges + " change", "\n" + nrChanges + " changes");
    }

    if (Output.isHiddenTask(pTask)) {
      txt += "\nhidden";
    }

    while (pSpan.classList.length > 0) {
      pSpan.classList.remove(pSpan.classList.item(0));
    }

    if (pTask.result === null) {
      pSpan.classList.add("task-skipped");
    } else if (pTask.result) {
      pSpan.classList.add("task-success");
    } else {
      pSpan.classList.add("task-failure");
    }
    if (nrChanges) {
      pSpan.classList.add("task-changes");
    }

    for (const key in pTask) {
      /* eslint-disable curly */
      if (key === "___key___") continue;
      if (key === "__id__") continue;
      if (key === "__jid__") continue;
      if (key === "__orchestration__") continue;
      if (key === "__run_num__") continue;
      if (key === "__sls__") continue;
      if (key === "_stamp") continue;
      if (key === "changes") continue;
      if (key === "comment") continue;
      if (key === "duration") continue;
      if (key === "fun") continue;
      if (key === "id") continue;
      if (key === "jid") continue;
      if (key === "name") continue;
      if (key === "pchanges") continue;
      if (key === "return") continue;
      if (key === "skip_watch") continue;
      if (key === "start_time") continue;
      if (key === "success") continue;
      /* eslint-enable curly */
      // skip trivial info: result = true
      if (key === "result" && pTask[key]) {
        continue;
      }
      txt += "\n" + key + " = ";
      if (typeof pTask.changes === "object") {
        txt += JSON.stringify(pTask[key]);
      } else {
        txt += pTask[key];
      }
    }

    Utils.addToolTip(pSpan, txt.trim());
  }

  // add the status summary
  static _addHighStateSummary (pMinionRow, pMinionDiv, pMinionId, pTasks) {

    let nr = 0;

    for (const task of pTasks) {

      nr += 1;

      const span = Utils.createSpan("", Character.BLACK_CIRCLE);

      Output._setTaskTooltip(span, task);

      const myNr = nr;
      span.addEventListener("click", () => {

        // show the output, it might be hidden
        const triangle = pMinionDiv.querySelector("span.triangle");
        triangle.innerText = Character.WHITE_DOWN_POINTING_TRIANGLE;
        const outputDiv = pMinionDiv.querySelector("div");
        outputDiv.style.display = "";

        const showId = Utils.getIdFromMinionId(pMinionId + "." + myNr);
        const taskDiv = pMinionDiv.querySelector("#" + showId);

        if (taskDiv === null) {
          // probably hidden due to state_hidden
          return;
        }

        // show where the information is
        taskDiv.classList.add("highlight-task");
        window.setTimeout(() => {
          taskDiv.classList.remove("highlight-task");
          if (!taskDiv.classList.length) {
            taskDiv.removeAttribute("class");
          }
        }, 1000);

        // behavior: smooth is ok, the destination is nearby
        // block: since block is below our summary, nearest is equivalent to end
        taskDiv.scrollIntoView({"behavior": "smooth", "block": "nearest"});
      });

      pMinionRow.append(span);
    }
  }

  static _getIsSuccess (pMinionResponse) {
    if (Output._hasProperties(pMinionResponse, ["retcode", "return", "success"])) {
      return pMinionResponse.success;
    }
    return true;
  }

  static _getRetCode (pMinionResponse) {
    if (Output._hasProperties(pMinionResponse, ["retcode", "return", "success"])) {
      return pMinionResponse.retcode;
    }
    return 0;
  }

  static _getMinionResponse (pCommand, pMinionResponse) {
    if (Output._hasProperties(pMinionResponse, ["retcode", "return", "success"])) {
      return pMinionResponse.return;
    }
    if (pCommand.startsWith("runner.") && pMinionResponse && pMinionResponse["return"] !== undefined) {
      return pMinionResponse.return.return;
    }
    return pMinionResponse;
  }

  static getMinionLabelClass (pIsSuccess, pResponse) {
    // the standard label is the minionId,
    // TODO: colored based on the retcode
    if (!pIsSuccess) {
      return "host-failure";
    }
    if (pResponse === undefined) {
      return "host-no-response";
    }
    return "host-success";
  }

  // the orchestrator for the output
  // determines what format should be used and uses that
  static addResponseOutput (pOutputContainer, pJobId, pMinionData, pResponse, pCommand, pInitialStatus) {

    // remove old content
    pOutputContainer.innerText = "";

    // reformat runner/wheel output into regular output
    pResponse = Output._addVirtualMinion(pResponse, pCommand);

    if (typeof pResponse === "string") {
      // do not format a string as an object
      pOutputContainer.innerText = pResponse;
      return;
    }

    if (typeof pResponse !== "object" || Array.isArray(pResponse)) {
      pOutputContainer.innerText = Output.formatObject(pResponse);
      return;
    }

    // it might be documentation
    const commandArg = pCommand.trim().replace(/^[a-z.]* */i, "");
    const isDocumentationOutput = OutputDocumentation.isDocumentationOutput(pResponse, commandArg);
    if (isDocumentationOutput) {
      OutputDocumentation.reduceDocumentationOutput(pResponse, commandArg, commandArg);
      OutputDocumentation.addDocumentationOutput(pOutputContainer, pResponse);
      return;
    }

    const allDiv = Utils.createDiv("no-search");
    const cntMinions = pMinionData.length;

    if (!pCommand.startsWith("runners.") &&
       !pCommand.startsWith("wheel.") &&
       !Output._isAsyncOutput(pResponse)) {
      // runners/wheel responses are not per minion
      // Do not produce a #response line for async-start confirmation

      // for the result of jobs.active
      const summaryJobsActiveSpan = Utils.createSpan("", pInitialStatus, "summary-jobs-active");

      // for the result of jobs.list_job
      const summaryJobsListJobSpan = Utils.createSpan("", "", "summary-list-job");

      const cntResponses = Object.keys(pResponse).length;

      let txt = Utils.txtZeroOneMany(cntResponses,
        "", ", {0} response", ", {0} responses");

      const summary = {};
      for (const minionId in pResponse) {
        const result = pResponse[minionId];
        // when full_return is not used, the result is simpler
        if (result === null) {
          continue;
        }
        if (typeof result !== "object") {
          continue;
        }
        if (!("success" in result)) {
          continue;
        }
        // use keys that can conveniently be sorted
        const key = (result.success ? "0-" : "1-") + result.retcode;
        if (summary[key] === undefined) {
          summary[key] = 0;
        }
        summary[key] += 1;
      }

      const keys = Object.keys(summary).sort();
      for (const key of keys) {
        txt += ", ";
        if (key.startsWith("0-")) {
          txt += Utils.txtZeroOneMany(summary[key],
            "", "{0} success", "{0} successes");
        } else {
          // if (key.startsWith("1-"))
          txt += Utils.txtZeroOneMany(summary[key],
            "", "{0} failure", "{0} failures");
        }
        if (key !== "0-0" && key !== "1-1") {
          // don't show the retcode for expected combinations
          txt += "(" + key.substr(2) + ")";
        }
      }

      txt += Utils.txtZeroOneMany(cntMinions - cntResponses,
        "", ", {0} no response", ", {0} no responses");

      if (cntResponses > 0 && cntMinions !== cntResponses) {
        txt += ", " + cntMinions + " total";
      }

      allDiv.appendChild(summaryJobsActiveSpan);

      summaryJobsListJobSpan.innerText = txt;
      allDiv.appendChild(summaryJobsListJobSpan);
    }

    const masterTriangle = Utils.createSpan();
    // use cntMinions instead of cntResponses to be predictable
    // hide details when there are many minions to show
    if (cntMinions > 50) {
      masterTriangle.innerText = Character.WHITE_RIGHT_POINTING_TRIANGLE;
    } else {
      masterTriangle.innerText = Character.WHITE_DOWN_POINTING_TRIANGLE;
    }
    masterTriangle.style.cursor = "pointer";
    allDiv.appendChild(masterTriangle);

    pOutputContainer.appendChild(allDiv);

    masterTriangle.addEventListener("click", () => {
      if (masterTriangle.innerText === Character.WHITE_DOWN_POINTING_TRIANGLE) {
        masterTriangle.innerText = Character.WHITE_RIGHT_POINTING_TRIANGLE;
      } else {
        masterTriangle.innerText = Character.WHITE_DOWN_POINTING_TRIANGLE;
      }

      for (const div of pOutputContainer.childNodes) {
        // only click on items that are collapsible
        const childs = div.getElementsByClassName("triangle");
        if (childs.length !== 1) {
          continue;
        }
        // do not collapse the "all" item again
        const tr = childs[0];
        if (tr === masterTriangle) {
          continue;
        }
        // only click on items that are not already the same as "all"
        if (tr.innerText === masterTriangle.innerText) {
          continue;
        }
        // (un)collapse the minion
        const clickEvent = new MouseEvent("click", {});
        tr.dispatchEvent(clickEvent);
      }
    });

    let nrMultiLineBlocks = 0;

    // convert state.orchestrate output back to regular highstate
    if (pResponse.RUNNER && pResponse.RUNNER.outputter === "highstate") {
      pResponse = pResponse.RUNNER.data;
      pMinionData = Object.keys(pResponse);
    }

    // for all other types we consider the output per minion
    // this is more generic and it simplifies the handlers
    for (const minionId of pMinionData.sort()) {

      let minionResponse = pResponse[minionId];

      const isSuccess = Output._getIsSuccess(minionResponse);
      // const retCode = Output._getRetCode(minionResponse);
      minionResponse = Output._getMinionResponse(pCommand, minionResponse);

      const minionClass = Output.getMinionLabelClass(isSuccess, minionResponse);
      let minionLabel = Output.getMinionIdHtml(minionId, minionClass);

      let minionOutput = null;
      let fndRepresentation = false;

      // implicit !fndRepresentation&&
      if (pResponse[minionId] === undefined) {
        minionOutput = Output._getTextOutput("(no response)");
        minionOutput.classList.add("noresponse");
        fndRepresentation = true;
      }

      let minionMultiLine = false;

      if (!fndRepresentation && typeof minionResponse === "string") {
        minionOutput = Output._getTextOutput(minionResponse);
        minionMultiLine = Utils.isMultiLineString(minionResponse);
        fndRepresentation = true;
      }

      if (!fndRepresentation && typeof minionResponse !== "object") {
        minionOutput = Output._getNormalOutput(minionResponse);
        fndRepresentation = true;
      }

      // null is an object, but treat it separatelly
      if (!fndRepresentation && minionResponse === null) {
        minionOutput = Output._getNormalOutput(minionResponse);
        fndRepresentation = true;
      }

      // an array is an object, but treat it separatelly
      if (!fndRepresentation && Array.isArray(minionResponse)) {
        minionOutput = Output._getNormalOutput(minionResponse);
        minionMultiLine = minionOutput.tagName === "DIV";
        fndRepresentation = true;
      }

      // it might be highstate output
      const commandCmd = pCommand.trim().replace(/ .*/, "");
      const isHighStateOutput = OutputHighstate.isHighStateOutput(commandCmd, minionResponse);

      const tasks = [];
      if (isHighStateOutput) {
        // The tasks are in an (unordered) object with uninteresting keys
        // convert it to an array that is in execution order
        // first put all the values in an array
        Object.keys(minionResponse).forEach(
          (taskKey) => {
            minionResponse[taskKey].___key___ = taskKey;
            tasks.push(minionResponse[taskKey]);
          }
        );
        // then sort the array
        tasks.sort((aa, bb) => aa.__run_num__ - bb.__run_num__);
      }

      let addHighStateSummaryFlag = false;
      // enhanced highstate display
      if (!fndRepresentation && isHighStateOutput && Output.isOutputFormatAllowed("saltguihighstate")) {
        minionLabel = OutputHighstate.getHighStateLabel(minionId, minionResponse);
        minionOutput = OutputHighstate.getHighStateOutput(minionId, tasks, pJobId);
        minionMultiLine = true;
        fndRepresentation = true;
        addHighStateSummaryFlag = true;
      }
      // regular highstate display
      if (!fndRepresentation && isHighStateOutput && Output.isOutputFormatAllowed("highstate")) {
        minionLabel = OutputHighstate.getHighStateLabel(minionId, minionResponse);
        minionOutput = OutputHighstate.getHighStateOutput(minionId, tasks, pJobId);
        minionMultiLine = true;
        fndRepresentation = true;
        addHighStateSummaryFlag = true;
      }

      // nothing special? then it is normal output
      if (!fndRepresentation) {
        minionOutput = Output._getNormalOutput(minionResponse);
        if (minionOutput.tagName === "DIV") {
          minionMultiLine = true;
        } else if (typeof minionOutput === "string" && Utils.isMultiLineString(minionOutput)) {
          minionMultiLine = true;
        }
      }

      if (minionMultiLine) {
        nrMultiLineBlocks += 1;
      }

      // compose the actual output
      const div = Utils.createDiv("", "", Utils.getIdFromMinionId(minionId));

      const minionRow = Utils.createSpan();

      minionRow.append(minionLabel);

      minionRow.appendChild(document.createTextNode(":"));

      // multiple line, collapsible
      let triangle = null;
      if (minionMultiLine) {
        triangle = Utils.createSpan("triangle", masterTriangle.innerText);
        triangle.style.cursor = "pointer";
        triangle.addEventListener("click", () => {
          if (triangle.innerText === Character.WHITE_DOWN_POINTING_TRIANGLE) {
            triangle.innerText = Character.WHITE_RIGHT_POINTING_TRIANGLE;
            minionOutput.style.display = "none";
          } else {
            triangle.innerText = Character.WHITE_DOWN_POINTING_TRIANGLE;
            minionOutput.style.display = "";
          }
        });
        minionRow.appendChild(triangle);

        if (addHighStateSummaryFlag) {
          Output._addHighStateSummary(minionRow, div, minionId, tasks);
        }
      }

      div.append(minionRow);

      if (minionMultiLine) {
        div.appendChild(document.createElement("br"));
      }

      // move back to the top of the host, that makes
      // it easier to select the next highstate part
      // or just collapse it and see the next minion
      if (isHighStateOutput) {
        minionOutput.addEventListener("click", () => {
          // show where we are scrolling back to
          minionRow.classList.add("highlight-task");
          window.setTimeout(() => {
            minionRow.classList.remove("highlight-task");
            if (!minionRow.classList.length) {
              minionRow.removeAttribute("class");
            }
          }, 1000);

          div.scrollIntoView({"behavior": "smooth", "block": "start"});
        });
      }

      minionOutput.classList.add("minion-output");
      minionOutput.classList.add(minionMultiLine ? "minion-output-multiple" : "minion-output-single");
      // hide the per-minion details when we have so many minions
      if (triangle && triangle.innerText === Character.WHITE_RIGHT_POINTING_TRIANGLE) {
        minionOutput.style.display = "none";
      }
      div.append(minionOutput);

      pOutputContainer.append(div);
    }

    if (nrMultiLineBlocks <= 1) {
      // No collapsible elements, hide the master
      // Also hide with 1 collapsible element
      masterTriangle.style.display = "none";
    }

    // no minions in the result
    if (!Object.keys(pMinionData).length) {
      pOutputContainer.innerText = "No minions matched the target. No command was sent, no jid was assigned.\nERROR: No return received";
    }
  }
}
