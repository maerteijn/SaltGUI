/* global */

import {MinionsPanel} from "../panels/Minions.js";
import {Page} from "./Page.js";

export class MinionsPage extends Page {

  constructor (pRouter) {
    super("minions", "Minions", "page-minions", "button-minions", pRouter);

    this.minions = new MinionsPanel();
    super.addPanel(this.minions);
    this.addJobsSummaryPanel();
  }
}
