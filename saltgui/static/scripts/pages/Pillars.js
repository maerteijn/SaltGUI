/* global */

import {Page} from "./Page.js";
import {PillarsPanel} from "../panels/Pillars.js";

export class PillarsPage extends Page {

  constructor (pRouter) {
    super("pillars", "Pillars", "button-pillars", pRouter);

    this.pillars = new PillarsPanel();
    super.addPanel(this.pillars);
    this.addJobsSummaryPanel();
  }
}
