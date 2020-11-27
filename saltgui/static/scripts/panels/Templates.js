/* global document */

import {DropDownMenu} from "../DropDown.js";
import {JobPanel} from "./Job.js";
import {Panel} from "./Panel.js";
import {Router} from "../Router.js";
import {Utils} from "../Utils.js";

export class TemplatesPanel extends Panel {

  constructor () {
    super("templates");

    this.addTitle("Templates");
    this.addSearchButton();
    this.addTable(["Name", "Location", "Description", "Target", "Command", "-menu-"]);
    this.setTableSortable("Name", "asc");
    this.setTableClickable();
    this.addMsg();
  }

  onShow () {
    const wheelConfigValuesPromise = this.api.getWheelConfigValues();

    wheelConfigValuesPromise.then((pWheelConfigValuesData) => {
      this._handleTemplatesWheelConfigValues(pWheelConfigValuesData);
      return true;
    }, (pWheelConfigValuesMsg) => {
      this._handleTemplatesWheelConfigValues(JSON.stringify(pWheelConfigValuesMsg));
      return false;
    });
  }

  _handleTemplatesWheelConfigValues (pWheelConfigValuesData) {
    if (this.showErrorRowInstead(pWheelConfigValuesData)) {
      return;
    }

    // should we update it or just use from cache (see commandbox) ?
    let masterTemplates = pWheelConfigValuesData.return[0].data.return.saltgui_templates;
    if (masterTemplates) {
      Utils.setStorageItem("session", "templates", JSON.stringify(masterTemplates));
      Router.updateMainMenu();
    } else {
      masterTemplates = {};
    }

    const masterKeys = Object.keys(masterTemplates).sort();
    for (const key of masterKeys) {
      const template = masterTemplates[key];
      this._addTemplate("master", key, template);
    }

    const localTemplatesText = Utils.getStorageItem("local", "templates", "{}");
    const localTemplates = JSON.parse(localTemplatesText);

    const localKeys = Object.keys(localTemplates).sort();
    for (const key of localKeys) {
      const template = localTemplates[key];
      this._addTemplate("local", key, template);
    }

    let txt = Utils.txtZeroOneMany(masterKeys.length + localKeys.length,
      "No templates", "{0} template", "{0} templates");
    if (masterKeys.length > 0 && localKeys.length > 0) {
      txt += Utils.txtZeroOneMany(masterKeys.length,
        "", ", {0} master template", ", {0} master templates");
      txt += Utils.txtZeroOneMany(localKeys.length,
        "", ", {0} local template", ", {0} local templates");
    }
    this.setMsg(txt);
  }

  _addTemplate (pLocation, pTemplateName, template) {
    const tr = document.createElement("tr");

    tr.appendChild(Utils.createTd("name", pTemplateName));

    tr.appendChild(Utils.createTd("location", pLocation));

    // calculate description
    const description = template["description"];
    if (description) {
      tr.appendChild(Utils.createTd("description", description));
    } else {
      tr.appendChild(Utils.createTd("description value-none", "(none)"));
    }

    // calculate targettype
    const targetType = template["targettype"];
    // calculate target
    const target = template["target"];
    if (!targetType && !target) {
      tr.appendChild(Utils.createTd("target value-none", "(none)"));
    } else if (!target) {
      // implies: targetType is not empty
      tr.appendChild(Utils.createTd("target", targetType));
    } else if (targetType) {
      // implies: both are not empty
      tr.appendChild(Utils.createTd("target", targetType + " " + target));
    } else {
      // implies: target is not empty
      tr.appendChild(Utils.createTd("target", target));
    }

    // calculate command
    const command = template["command"];
    if (command) {
      tr.appendChild(Utils.createTd("command", command));
    } else {
      tr.appendChild(Utils.createTd("command value-none", "(none)"));
    }

    const menu = new DropDownMenu(tr);
    this._addMenuItemApplyTemplate(menu, targetType, target, command);
    if (pLocation === "local") {
      this._addMenuItemEditTemplate(menu, pTemplateName, description, targetType, target, command);
      this._addMenuItemDeleteTemplate(menu, pTemplateName);
    }

    const tbody = this.table.tBodies[0];
    tbody.appendChild(tr);

    tr.addEventListener("click", (pClickEvent) => {
      this.runFullCommand(pClickEvent, targetType, target, command);
    });
  }

  _addMenuItemApplyTemplate (pMenu, pTargetType, pTarget, pCommand) {
    pMenu.addMenuItem("Apply template...", (pClickEvent) => {
      this.runFullCommand(pClickEvent, pTargetType, pTarget, pCommand);
    });
  }

  _addMenuItemEditTemplate (pMenu, pName, pDescription, pTargetType, pTarget, pCommand) {
    pMenu.addMenuItem("Edit template...", (pClickEvent) => {
      let cmd = "#template.edit";
      cmd += JobPanel.getArgumentText("name", pName);
      cmd += JobPanel.getArgumentText("targettype", pTargetType);
      cmd += JobPanel.getArgumentText("target", pTarget);
      cmd += JobPanel.getArgumentText("command", pCommand);
      cmd += JobPanel.getArgumentText("description", pDescription);
      this.runFullCommand(pClickEvent, null, null, cmd);
    });
  }

  _addMenuItemDeleteTemplate (pMenu, pName) {
    pMenu.addMenuItem("Delete template...", (pClickEvent) => {
      let cmd = "#template.delete";
      cmd += JobPanel.getArgumentText("name", pName);
      this.runFullCommand(pClickEvent, null, null, cmd);
    });
  }
}
