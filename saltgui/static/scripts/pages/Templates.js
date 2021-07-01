/* global */

import {Page} from "./Page.js";
import {TemplatesPanel} from "../panels/Templates.js";
import {Utils} from "../Utils.js";

export class TemplatesPage extends Page {

  constructor (pRouter) {
    super("templates", "Templates", "button-templates", pRouter);

    this.templates = new TemplatesPanel();
    super.addPanel(this.templates);
    this.addJobsSummaryPanel();
  }

  static isVisible () {
    // show template menu item if templates defined
    const templatesText = Utils.getStorageItem("session", "templates", "");
    return templatesText;
  }
}
