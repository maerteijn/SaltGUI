/* global */

import {Page} from "./Page.js";
import {PillarsMinionPanel} from "../panels/PillarsMinion.js";

export class PillarsMinionPage extends Page {

  constructor (pRouter) {
    super("pillars-minion", "Pillars", "button-pillars", pRouter);

    this.pillarsminion = new PillarsMinionPanel();
    super.addPanel(this.pillarsminion);
    this.addJobsSummaryPanel();
  }
}
