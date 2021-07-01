/* global */

import {BeaconsMinionPanel} from "../panels/BeaconsMinion.js";
import {Page} from "./Page.js";

export class BeaconsMinionPage extends Page {

  constructor (pRouter) {
    super("beacons-minion", "Beacons", "button-beacons", pRouter);

    this.beaconsminion = new BeaconsMinionPanel();
    super.addPanel(this.beaconsminion);
    this.addJobsSummaryPanel();
  }

  handleSaltBeaconEvent (pTag, pData) {
    this.beaconsminion.handleSaltBeaconEvent(pTag, pData);
  }
}
