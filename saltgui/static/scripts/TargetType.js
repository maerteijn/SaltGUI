/* global console document */

import {Character} from "./Character.js";
import {DropDownMenuRadio} from "./DropDownRadio.js";
import {Utils} from "./Utils.js";

export class TargetType {

  static createMenu () {
    const targetbox = document.getElementById("target-box");
    TargetType.menuTargetType = new DropDownMenuRadio(targetbox);
    // do not show the menu title at first
    TargetType.menuTargetType.setTitle("");
    TargetType.menuTargetType.addMenuItemRadio("glob", "Normal");
    TargetType.menuTargetType.addMenuItemRadio("list", "List");
    TargetType.menuTargetType.addMenuItemRadio("nodegroup", (pMenuItem) => TargetType._targetTypeNodeGroupPrepare(pMenuItem));
    TargetType.menuTargetType.addMenuItemRadio("compound", "Compound");
    TargetType.autoSelectTargetType("");
  }

  // It takes a while before we known the list of nodegroups
  // so this conclusion must be re-evaluated each time
  static _targetTypeNodeGroupPrepare (pMenuItem) {
    const nodeGroupsText = Utils.getStorageItem("session", "nodegroups");
    if (!nodeGroupsText || nodeGroupsText === "{}") {
      return null;
    }

    // optimization as the list of nodegroups will not change until the next login
    // but mainly to preserve the highlight marker
    pMenuItem.verifyCallBack = null;

    return "Nodegroup";
  }

  static _manualUpdateTargetTypeText () {
    TargetType.menuTargetType._system = false;
    TargetType._updateTargetTypeText();
  }

  static setTargetTypeDefault () {
    TargetType.menuTargetType._system = true;
    TargetType.menuTargetType._value = "glob";
    TargetType._updateTargetTypeText();
  }

  static _updateTargetTypeText () {
    const targetType = TargetType._getTargetType();

    switch (targetType) {
    case "compound":
      TargetType.menuTargetType.setTitle("Compound");
      break;
    case "glob":
      if (TargetType.menuTargetType._system) {
        // reset the title to the absolute minimum
        // so that the menu does not stand out in trivial situations
        TargetType.menuTargetType.setTitle("");
      } else {
        TargetType.menuTargetType.setTitle("Normal");
      }
      break;
    case "list":
      TargetType.menuTargetType.setTitle("List");
      break;
    case "nodegroup":
      TargetType.menuTargetType.setTitle("Nodegroup");
      break;
    default:
      console.error("targetType", targetType);
    }

    TargetType.menuTargetType._value = targetType;

    TargetType._setMenuMarker();
  }

  static _setMenuMarker () {
    const targetType = TargetType._getTargetType();
    const menuItems = TargetType.menuTargetType.menuDropdownContent.children;
    for (let i = 0; i < menuItems.length; i++) {
      let menuItemText = menuItems[i].innerText;
      menuItemText = menuItemText.replace(/^. /, "");
      if (menuItems[i]._value === targetType) {
        menuItemText = Character.BLACK_CIRCLE + " " + menuItemText;
      }
      menuItems[i].innerText = menuItemText;
    }
    return null;
  }

  static autoSelectTargetType (pTarget) {

    if (pTarget.includes("@") || pTarget.includes(" ") ||
      pTarget.includes("(") || pTarget.includes(")")) {
      // "@" is a strong indicator for compound target
      // but "space", "(" and ")" are also typical for compound target
      TargetType.menuTargetType.setDefaultValue("compound");
    } else if (pTarget.includes(",")) {
      // "," is a strong indicator for list target (when it is also not compound)
      TargetType.menuTargetType.setDefaultValue("list");
    } else if (pTarget.startsWith("#")) {
      // "#" at the start of a line is a strong indicator for nodegroup target
      // this is not a SALTSTACK standard, but our own invention
      TargetType.menuTargetType.setDefaultValue("nodegroup");
    } else {
      TargetType.menuTargetType.setDefaultValue("glob");
    }
  }

  static setTargetType (pTargetType) {
    TargetType.menuTargetType.setValue(pTargetType);
  }

  static _getTargetType () {
    const targetType = TargetType.menuTargetType.getValue();
    return targetType;
  }

  static makeTargetText (pObj) {
    const targetType = pObj["Target-type"];
    const targetPattern = pObj.Target;

    // note that "glob" is the most common case
    // when used from the command-line, that target-type
    // is not even specified.
    // therefore we suppress that one

    // note that due to bug in 2018.3, all finished jobs
    // will be shown as if of type "list"
    // therefore we suppress that one

    let returnText = "";
    if (targetType !== "glob" && targetType !== "list") {
      returnText = targetType + " ";
    }
    returnText += targetPattern;
    return returnText;
  }
}
