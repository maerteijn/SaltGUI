/* global */

import {OptionsPanel} from "../panels/Options.js";
import {Page} from "./Page.js";
import {StatsPanel} from "../panels/Stats.js";

export class OptionsPage extends Page {

  constructor (pRouter) {
    super("options", "Options", "", pRouter);

    this.options = new OptionsPanel();
    super.addPanel(this.options);
    this.stats = new StatsPanel();
    super.addPanel(this.stats);
  }
}
