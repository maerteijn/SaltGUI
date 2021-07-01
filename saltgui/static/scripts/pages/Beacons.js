/* global */

import {BeaconsPanel} from "../panels/Beacons.js";
import {Page} from "./Page.js";

export class BeaconsPage extends Page {

  constructor (pRouter) {
    super("beacons", "Beacons", "button-beacons", pRouter);

    this.beacons = new BeaconsPanel();
    super.addPanel(this.beacons);
    this.addJobsSummaryPanel();
  }
}
