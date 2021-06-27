import {Output} from "./Output.js";
import {Utils} from "../Utils.js";

export class OutputHighstateSummaryOriginal {

  static addSummarySpan (pDiv, pMinionId, pSucceeded, pFailed, pSkipped, pTotalMilliSeconds, pChangesSummary) {

    let txt = "\nSummary for " + pMinionId;
    txt += "\n------------";
    const summarySpan = Utils.createSpan("", txt);
    summarySpan.style.color = "aqua";
    pDiv.append(summarySpan);

    txt = "\nSucceeded: " + pSucceeded;
    const succeededSpan = Utils.createSpan("task-success", txt);
    pDiv.append(succeededSpan);

    if (pChangesSummary > 0) {
      txt = " (";
      const oSpan = Utils.createSpan("", txt);
      oSpan.style.color = "white";
      pDiv.append(oSpan);

      txt = "changed=" + pChangesSummary;
      const changedSpan = Utils.createSpan("task-changes", txt);
      pDiv.append(changedSpan);

      txt = ")";
      const cSpan = Utils.createSpan("", txt);
      cSpan.style.color = "white";
      pDiv.append(cSpan);
    }

    txt = "\nFailed:    " + pFailed;
    const failedSpan = Utils.createSpan("", txt);
    if (pFailed > 0) {
      failedSpan.classList.add("task-failure");
    } else {
      failedSpan.style.color = "aqua";
    }
    pDiv.append(failedSpan);

    txt = "\n------------";
    txt += "\nTotal states run: " + (pSucceeded + pSkipped + pFailed);
    txt += "\nTotal run time: " + Output.getDuration(pTotalMilliSeconds);
    const totalsSpan = Utils.createSpan("", txt);
    totalsSpan.style.color = "aqua";
    pDiv.append(totalsSpan);
  }
}
