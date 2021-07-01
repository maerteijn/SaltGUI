/* global */

import {EventsPanel} from "../panels/Events.js";
import {Page} from "./Page.js";

export class EventsPage extends Page {

  constructor (pRouter) {
    // don't use /events for the page, that url is reserved
    super("eventsview", "Events", "button-events", pRouter);

    this.events = new EventsPanel();
    super.addPanel(this.events);
  }

  handleAnyEvent (tag, data) {
    this.events.handleAnyEvent(tag, data);
  }
}
