/* global */

import {Page} from "./Page.js";
import {SchedulesMinionPanel} from "../panels/SchedulesMinion.js";

export class SchedulesMinionPage extends Page {

  constructor (pRouter) {
    super("schedules-minion", "Schedules", "button-schedules", pRouter);

    this.schedulesminion = new SchedulesMinionPanel();
    super.addPanel(this.schedulesminion);
    this.addJobsSummaryPanel();
  }
}
