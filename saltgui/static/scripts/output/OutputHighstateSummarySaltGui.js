import {Output} from "./Output.js";
import {Utils} from "../Utils.js";

export class OutputHighstateSummarySaltGui {

  static addSummarySpan (pDiv, pSucceeded, pFailed, pSkipped, pTotalMilliSeconds, pChangesDetail, pHidden) {

    // add a summary line
    let line = "";

    if (pSucceeded) {
      line += ", " + pSucceeded + " succeeded";
    }
    if (pSkipped) {
      line += ", " + pSkipped + " skipped";
    }
    if (pFailed) {
      line += ", " + pFailed + " failed";
    }
    if (pHidden) {
      line += ", " + pHidden + " hidden";
    }
    const total = pSucceeded + pSkipped + pFailed;
    if (total !== pSucceeded && total !== pSkipped && total !== pFailed) {
      // not a trivial total
      line += ", " + total + " total";
    }

    // note that the number of changes may be higher or lower
    // than the number of tasks. tasks may contribute multiple
    // changes, or tasks may have no changes.
    line += Utils.txtZeroOneMany(pChangesDetail, "", ", {0} change", ", {0} changes");

    // multiple durations and significant?
    if (total > 1 && pTotalMilliSeconds >= 10) {
      line += ", " + Output.getDuration(pTotalMilliSeconds);
    }

    if (line) {
      const txtDiv = Utils.createDiv("", line.substring(2));
      pDiv.append(txtDiv);
    }
  }
}
