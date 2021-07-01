/* global */

import {GrainsMinionPanel} from "../panels/GrainsMinion.js";
import {Page} from "./Page.js";

export class GrainsMinionPage extends Page {

  constructor (pRouter) {
    super("grains-minion", "Grains", "button-grains", pRouter);

    this.grainsminion = new GrainsMinionPanel();
    super.addPanel(this.grainsminion);
    this.addJobsSummaryPanel();
  }
}
