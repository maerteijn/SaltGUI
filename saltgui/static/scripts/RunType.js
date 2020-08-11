/* global document */

import {DropDownMenuRadio} from "./DropDownRadio.js";

export class RunType {

  static createMenu () {
    const runblock = document.getElementById("run-block");
    RunType.menuRunType = new DropDownMenuRadio(runblock);
    RunType.menuRunType.setDefaultValue("normal");
    RunType.menuRunType.addMenuItemRadio("normal", "Normal");
    RunType.menuRunType.addMenuItemRadio("async", "Async");
  }

  static setRunTypeDefault () {
    RunType.menuRunType.setValue(null);
    // reset the title to the absolute minimum
    // so that the menu does not stand out in trivial situations
    RunType.menuRunType.setTitle("");
  }

  static getRunType () {
    const runType = RunType.menuRunType.getValue();
    return runType;
  }
}
