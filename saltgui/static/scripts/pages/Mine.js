/* global */

import {JobsSummaryPanel} from "../panels/JobsSummary.js";
import {MinePanel} from "../panels/Mine.js";
import {Page} from "./Page.js";

export class MinePage extends Page {

  constructor (pRouter) {
    super("mine", "Mine", "page-mine", "button-mine", pRouter);

    this.mine = new MinePanel();
    super.addPanel(this.mine);
    this.jobs = new JobsSummaryPanel();
    super.addPanel(this.jobs);
  }

  onShow () {
    this.mine.onShow();
    this.jobs.onShow();
  }
}
