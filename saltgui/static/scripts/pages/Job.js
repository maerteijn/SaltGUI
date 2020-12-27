/* global */

import {JobPanel} from "../panels/Job.js";
import {Page} from "./Page.js";

export class JobPage extends Page {

  constructor (pRouter) {
    super("job", "Job", "button-jobs", pRouter);

    this.job = new JobPanel();
    super.addPanel(this.job);
  }

  handleSaltJobRetEvent (pData) {
    this.job.handleSaltJobRetEvent(pData);
  }
}
