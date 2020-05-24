/* global */

import {JobsSummaryPanel} from "../panels/JobsSummary.js";
import {OrchestrationsPanel} from "../panels/Orchestrations.js";
import {Page} from "./Page.js";

export class OrchestrationsPage extends Page {

  constructor (pRouter) {
    super("orchestrations", "Orchestrations", "page-orchestrations", "button-orchestrations", pRouter);

    this.orchestrations = new OrchestrationsPanel();
    super.addPanel(this.orchestrations);
    this.jobs = new JobsSummaryPanel();
    super.addPanel(this.jobs);
  }
}
