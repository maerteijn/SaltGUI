/* global */

import {Page} from "./Page.js";
import {SchedulesPanel} from "../panels/Schedules.js";

export class SchedulesPage extends Page {

  constructor (pRouter) {
    super("schedules", "Schedules", "button-schedules", pRouter);

    this.schedules = new SchedulesPanel();
    super.addPanel(this.schedules);
    this.addJobsSummaryPanel();
  }
}
