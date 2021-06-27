/* global document */

import {Character} from "../Character.js";
import {Output} from "./Output.js";
import {Utils} from "../Utils.js";

export class OutputHighstateTaskSaltGui {

  static _addChangesInfo (pTaskDiv, pTask, pIndent) {
    if (pTask["changes"] === undefined) {
      return;
    }

    if (typeof pTask.changes !== "object" || Array.isArray(pTask.changes)) {
      pTaskDiv.append(document.createElement("br"));
      pTaskDiv.append(document.createTextNode(pIndent + JSON.stringify(pTask.changes)));
      return;
    }

    for (const key of Object.keys(pTask.changes).sort()) {

      const change = pTask.changes[key];

      if (key === "out" && change === "highstate") {
        // skip trivial case for orchestration
        continue;
      }

      if (typeof change === "string" && Utils.isMultiLineString(change)) {
        pTaskDiv.append(document.createElement("br"));
        // show multi-line text as a separate block
        pTaskDiv.append(document.createTextNode(pIndent + key + ":"));
        const lines = change.trim().split("\n");
        for (const line of lines) {
          pTaskDiv.append(document.createElement("br"));
          pTaskDiv.append(document.createTextNode("      " + line));
        }
        continue;
      }

      if (Array.isArray(change)) {
        for (const idx in change) {
          const task = change[idx];
          pTaskDiv.append(document.createElement("br"));
          pTaskDiv.append(document.createTextNode(
            pIndent + key + "[" + idx + "]: " + JSON.stringify(task)));
        }
        continue;
      }

      if (change === null || typeof change !== "object") {
        // show all other non-objects in a simple way
        pTaskDiv.append(document.createElement("br"));
        pTaskDiv.append(document.createTextNode(
          pIndent + key + ": " +
          JSON.stringify(change)));
        continue;
      }

      // treat old->new first
      if (change["old"] !== undefined && change["new"] !== undefined) {
        pTaskDiv.append(document.createElement("br"));
        // place changes on one line
        // don't use arrows here, these are higher than a regular
        // text-line and disturb the text-flow
        pTaskDiv.append(document.createTextNode(
          pIndent + key + ": " +
          JSON.stringify(change.old) + " " +
          Character.BLACK_RIGHT_POINTING_POINTER + " " +
          JSON.stringify(change.new)));
      }
      // then show whatever remains
      for (const taskkey of Object.keys(change).sort()) {

        // we already provided this as summary: old->new
        if (taskkey === "old" && change["new"] !== undefined) {
          continue;
        }
        if (taskkey === "new" && change["old"] !== undefined) {
          continue;
        }

        pTaskDiv.append(document.createElement("br"));
        pTaskDiv.append(document.createTextNode(
          pIndent + key + ": " + taskkey + ": " +
          JSON.stringify(change[taskkey])));
      }
    }
  }

  static getStateOutput (pTask, pTaskId, pTaskName, pFunctionName, pMinionId, pJobId) {
    const taskDiv = Utils.createDiv();

    const span = Utils.createSpan("task-icon");
    if (pTask.result === null) {
      span.innerText = Character.HEAVY_CHECK_MARK;
      span.classList.add("task-skipped");
    } else if (pTask.result) {
      span.innerText = Character.HEAVY_CHECK_MARK;
      span.classList.add("task-success");
    } else {
      span.innerText = Character.HEAVY_BALLOT_X;
      span.classList.add("task-failure");
    }
    // don't use task-changes here
    taskDiv.append(span);

    taskDiv.append(document.createTextNode(pTaskName));

    if (pTaskId && pTaskId !== pTaskName) {
      taskDiv.append(document.createTextNode(" id=" + encodeURIComponent(pTaskId)));
    }

    if (pTask.__sls__) {
      taskDiv.append(document.createTextNode(
        " (from " + pTask.__sls__.replace(".", "/") + ".sls)"));
    }

    const indent = "    ";

    taskDiv.append(document.createElement("br"));
    taskDiv.append(document.createTextNode(
      indent + "Function is " + pFunctionName));

    if (pTask.comment) {
      taskDiv.append(document.createElement("br"));
      let txt = pTask.comment;
      // trim extra whitespace
      txt = txt.replace(/[ \r\n]+$/g, "");
      // indent extra lines
      txt = txt.replace(/[\n]+/g, "\n" + indent);
      taskDiv.append(document.createTextNode(indent + txt));
    }

    OutputHighstateTaskSaltGui._addChangesInfo(taskDiv, pTask, indent);

    if (pTask["start_time"] !== undefined) {
      taskDiv.append(document.createElement("br"));
      taskDiv.append(document.createTextNode(
        indent + "Started at " + Output.dateTimeStr(pTask.start_time)));
    }

    if (pTask["duration"] !== undefined) {
      const milliSeconds = Math.round(pTask.duration);
      // TODO totalMilliSeconds += milliSeconds;
      if (milliSeconds >= 10) {
        // anything below 10ms is not worth reporting
        // report only the "slow" jobs
        // it still counts for the grand total thought
        taskDiv.append(document.createElement("br"));
        taskDiv.append(document.createTextNode(
          indent + "Duration " + Output.getDuration(milliSeconds)));
      }
    }

    // show any unknown attribute of a task
    // do not use Object.entries, that is not supported by the test framework
    for (const key of Object.keys(pTask)) {
      const item = pTask[key];
      /* eslint-disable line-comment-position,no-inline-comments,curly */
      if (key === "___key___") continue; // ignored, generated by us
      if (key === "__id__") continue; // handled
      if (key === "__jid__") continue; // internal use
      if (key === "__orchestration__") continue; // internal use
      if (key === "__sls__") continue; // handled
      if (key === "__run_num__") continue; // handled, not shown
      if (key === "changes") continue; // handled
      if (key === "comment") continue; // handled
      if (key === "duration") continue; // handled
      if (key === "host") continue; // ignored, same as host
      if (key === "id" && item === pMinionId) continue; // trivial
      if (key === "jid" && item === pJobId) continue; // trivial
      if (key === "name") continue; // handled
      if (key === "pchanges") continue; // ignored, also ignored by cli
      if (key === "result") continue; // handled
      if (key === "skip_watch") continue; // related to onlyif
      if (key === "start_time") continue; // handled
      /* eslint-enable line-comment-position,no-inline-comments,curly */
      taskDiv.append(document.createElement("br"));
      taskDiv.append(document.createTextNode(
        indent + key + " = " + JSON.stringify(item)));
    }

    return taskDiv;
  }
}
