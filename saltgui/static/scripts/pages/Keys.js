/* global */

import {KeysPanel} from "../panels/Keys.js";
import {Page} from "./Page.js";

export class KeysPage extends Page {

  constructor (pRouter) {
    super("keys", "Keys", "button-keys", pRouter);

    this.keys = new KeysPanel();
    super.addPanel(this.keys);
    this.addJobsSummaryPanel();
  }

  handleSaltAuthEvent (pData) {
    this.keys.handleSaltAuthEvent(pData);
  }

  handleSaltKeyEvent (pData) {
    this.keys.handleSaltKeyEvent(pData);
  }
}
