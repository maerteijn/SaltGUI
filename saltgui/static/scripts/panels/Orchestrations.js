/* global document */

import {Character} from "../Character.js";
import {DropDownMenu} from "../DropDown.js";
import {Panel} from "./Panel.js";
import {Utils} from "../Utils.js";

export class OrchestrationsPanel extends Panel {

  constructor () {
    super("orchestrations");

    this.addTitle("Orchestrations");
    this.addSearchButton();
    this.addTable(["Name", "Description", "Target", "Command", "-menu-"]);
    this.addMsg();
  }

  onShow () {
    const runnerStateOrchestrateShowSlsPromise = this.router.api.getRunnerStateOrchestrateShowSls();

    runnerStateOrchestrateShowSlsPromise.then((pStateOrchestrateShowSlsData) => {
      this._handleOrchestrationsStateOrchestrateShowSls(pStateOrchestrateShowSlsData);
    }, (pStateOrchestrateShowSlsMsg) => {
      this._handleOrchestrationsStateOrchestrateShowSls(JSON.stringify(pStateOrchestrateShowSlsMsg));
    });
  }

  _handleOrchestrationsStateOrchestrateShowSls (pStateOrchestrateShowSlsData) {
    if (this.showErrorRowInstead(pStateOrchestrateShowSlsData)) {
      return;
    }

    // should we update it or just use from cache (see commandbox) ?
    let orchestrations = pStateOrchestrateShowSlsData.return[0];
    if (!orchestrations) {
      orchestrations = {"dummy": {}};
    }
    orchestrations = orchestrations[Object.keys(orchestrations)[0]];
    if (!orchestrations) {
      orchestrations = {};
    }
    Utils.setStorageItem("session", "orchestrations", JSON.stringify(orchestrations));
    const keys = {};
    for (const key of Object.keys(orchestrations)) {
      keys[orchestrations[key].__sls__] = [];
    }
    for (const key of Object.keys(orchestrations)) {
      const orchestration = orchestrations[key];
      keys[orchestration.__sls__][key] = orchestration;
    }
    for (const key of Object.keys(keys).sort()) {
      const orchestration = keys[key];
      this._addOrchestration(key, orchestration);
    }

    const msgDiv = document.getElementById("orchestrations-msg");
    const txt = Utils.txtZeroOneMany(keys.length,
      "No orchestrations", "{0} orchestration", "{0} orchestrations");
    msgDiv.innerText = txt;
  }

  _addOrchestration (pOrchestrationName, pOrchestrations) {

    const tr0 = document.createElement("tr");

    tr0.appendChild(Utils.createTd("name", pOrchestrationName));
    tr0.appendChild(Utils.createTd());
    tr0.appendChild(Utils.createTd());
    tr0.appendChild(Utils.createTd());

    const menu = new DropDownMenu(tr0);
    this._addMenuItemApplyOrchestration(menu, pOrchestrationName);
    this._addMenuItemApplyOrchestrationTest(menu, pOrchestrationName);

    this.table.tBodies[0].appendChild(tr0);

    tr0.addEventListener("click", (pClickEvent) => {
      this.runFullCommand(pClickEvent, "", "", "runners.state.orchestrate " + pOrchestrationName);
    });

    for (const name of Object.keys(pOrchestrations).sort()) {
      const orchestration = pOrchestrations[name];

      const tr1 = document.createElement("tr");

      tr1.appendChild(Utils.createTd("name", Character.NO_BREAK_SPACE.repeat(3) + name));

      // calculate description
      const description = orchestration["description"];
      if (description) {
        tr1.appendChild(Utils.createTd("description", description));
      } else {
        tr1.appendChild(Utils.createTd("description value-none", "(none)"));
      }

      // calculate targettype
      const targetType = orchestration["targettype"];
      // calculate target
      const target = orchestration["target"];
      if (!targetType && !target) {
        tr1.appendChild(Utils.createTd("target value-none", "(none)"));
      } else if (!target) {
        // targetType cannot be null here
        tr1.appendChild(Utils.createTd("target", targetType));
      } else if (targetType) {
        // targetcannot be null here
        tr1.appendChild(Utils.createTd("target", targetType + " " + target));
      } else {
        tr1.appendChild(Utils.createTd("target", target));
      }

      // calculate command
      const command = orchestration["command"];
      if (command) {
        tr1.appendChild(Utils.createTd("command", command));
      } else {
        tr1.appendChild(Utils.createTd("command value-none", "(none)"));
      }

      // no menu per item
      tr1.appendChild(Utils.createTd());

      this.table.tBodies[0].appendChild(tr1);
    }
  }

  _addMenuItemApplyOrchestration (pMenu, pOrchestrationName) {
    pMenu.addMenuItem("Apply orchestration...", (pClickEvent) => {
      this.runFullCommand(pClickEvent, "", "", "runners.state.orchestrate " + pOrchestrationName);
    });
  }

  _addMenuItemApplyOrchestrationTest (pMenu, pOrchestrationName) {
    pMenu.addMenuItem("Test orchestration...", (pClickEvent) => {
      this.runFullCommand(pClickEvent, "", "", "runners.state.orchestrate test=true " + pOrchestrationName);
    });
  }
}
