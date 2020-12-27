/* global */

import {GrainsPanel} from "../panels/Grains.js";
import {Page} from "./Page.js";

export class GrainsPage extends Page {

  constructor (pRouter) {
    super("grains", "Grains", "button-grains", pRouter);

    this.grains = new GrainsPanel();
    super.addPanel(this.grains);
    this.addJobsSummaryPanel();
  }
}
