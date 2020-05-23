/* global */

import {JobsSummaryPanel} from "../panels/JobsSummary.js";
import {MineMinionPanel} from "../panels/MineMinion.js";
import {Page} from "./Page.js";

export class MineMinionPage extends Page {

  constructor (pRouter) {
    super("mineminion", "Mine", "page-mine-minion", "button-mine", pRouter);

    this.mineminion = new MineMinionPanel();
    super.addPanel(this.mineminion);
    this.jobs = new JobsSummaryPanel();
    super.addPanel(this.jobs);
  }

  onShow () {
    this.mineminion.onShow();
    this.jobs.onShow();
  }
}
