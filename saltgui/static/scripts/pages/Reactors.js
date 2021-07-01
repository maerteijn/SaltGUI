/* global */

import {Page} from "./Page.js";
import {ReactorsPanel} from "../panels/Reactors.js";
import {Utils} from "../Utils.js";

export class ReactorsPage extends Page {

  constructor (pRouter) {
    super("reactors", "Reactors", "button-reactors", pRouter);

    this.reactors = new ReactorsPanel();
    super.addPanel(this.reactors);
    this.addJobsSummaryPanel();
  }

  static isVisible () {
    // show reactor menu item if reactors defined
    const reactorsText = Utils.getStorageItem("session", "reactors", "");
    return reactorsText;
  }
}
