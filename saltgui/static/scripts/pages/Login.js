/* global */

import {LoginPanel} from "../panels/Login.js";
import {Page} from "./Page.js";

export class LoginPage extends Page {

  constructor (pRouter) {
    super("login", "Login", "", pRouter);

    this.login = new LoginPanel();
    this.login.router = pRouter;
    super.addPanel(this.login);
  }
}
