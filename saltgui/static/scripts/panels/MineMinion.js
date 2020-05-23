/* global document window */

import {DropDownMenu} from "../DropDown.js";
import {Output} from "../output/Output.js";
import {Panel} from "./Panel.js";
import {Utils} from "../Utils.js";

export class MineMinionPanel extends Panel {

  constructor (pRouter) {
    super("mineminion", "Mine", "page-mine-minion", "button-mine", pRouter);

    this.addTitle("Mine on ...");
    this.addCloseButton();
    this.addPanelMenu();
    this.addSearchButton();
    this.addTable(["Info", "-menu-", "X", "Y"]);
    this.addMsg();
  }

  onShow () {
    const minionId = decodeURIComponent(Utils.getQueryParam("minionid"));

    this.updateTitle("Mine on " + minionId);

    const localMineValidPromise = this.router.api.getLocalMineValid(minionId);

    localMineValidPromise.then((pLocalMineValidData) => {
      this._handleLocalMineValid(pLocalMineValidData, minionId);
    }, (pLocalMineValidMsg) => {
      this._handleLocalMineValid(JSON.stringify(pLocalMineValidMsg), minionId);
    });

    // to update details
    // interval should be larger than the retrieval time
    // to prevent many of such jobs to appear
    window.setInterval(() => {
      this._updateNextMine();
    }, 1000);
  }

  _updateNextMine () {
    const tbody = this.table.tBodies[0];
    // find an item still marked as "(click)"
    for (const tr of tbody.rows) {
      const detailsField = tr.querySelector("td.mine-value2");
      if (detailsField.innerText !== "(click)") {
        continue;
      }
      const mineId = tr.querySelector("td").innerText;
      detailsField.classList.add("no-status");
      detailsField.innerText = "loading...";
      this._getMineDetails(detailsField, mineId);
      // only update one item at a time
      return;
    }
  }

  _getMineDetails (pDetailsField, pMineId) {
    const minionId = decodeURIComponent(Utils.getQueryParam("minionid"));
    const localMineGetPromise = this.router.api.getLocalMineGet(minionId, "*", pMineId);

    localMineGetPromise.then((pLocalMineGetData) => {
      MineMinionPanel._handleLocalMineGet(pDetailsField, pLocalMineGetData.return[0][minionId]);
    }, (pLocalMineGetData) => {
      MineMinionPanel._handleLocalMineGet(pDetailsField, JSON.stringify(pLocalMineGetData));
    });

    this._addMenuItemMineFlush(minionId);
  }

  static _handleLocalMineGet (pDetailsField, pLocalMineGetData) {
    pDetailsField.innerText = Output.formatObject(pLocalMineGetData);
  }

  _handleLocalMineValid (pLocalMineValidData, pMinionId) {
    if (this.showErrorRowInstead(pLocalMineValidData)) {
      return;
    }

    let mine = pLocalMineValidData.return[0][pMinionId];
    if (mine === null) {
      mine = {};
    }

    if (mine === undefined) {
      const msgDiv = this.div.querySelector(".msg");
      msgDiv.innerText = "Unknown minion '" + pMinionId + "'";
      return;
    }
    if (mine === false) {
      const msgDiv = this.div.querySelector(".msg");
      msgDiv.innerText = "Minion '" + pMinionId + "' did not answer";
      return;
    }
    const mineNames = Object.keys(mine).sort();
    for (const mineName of mineNames) {
      const mineTr = document.createElement("tr");

      const mineNameTd = Utils.createTd("mine-name", mineName);
      mineTr.appendChild(mineNameTd);

      let obj = mine[mineName];
      if (Array.isArray(obj) && obj.length === 1) {
        obj = obj[0];
      }
      const mineValue = Output.formatObject(obj);

      const mineMenu = new DropDownMenu(mineTr);
      this._addMenuItemMineDelete(mineMenu, pMinionId, mineName);

      // menu comes before this data on purpose
      const mineValue1Td = Utils.createTd("mine-value1", mineValue);
      mineTr.appendChild(mineValue1Td);

      const mineValue2Td = Utils.createTd("mine-value2", "(click)");
      mineTr.appendChild(mineValue2Td);

      this.table.tBodies[0].appendChild(mineTr);
    }

    const msgDiv = this.div.querySelector(".msg");
    const txt = Utils.txtZeroOneMany(mineNames.length,
      "No mines", "{0} mine", "{0} mines");
    msgDiv.innerText = txt;
  }

  _addMenuItemMineFlush (pMinionId) {
    this.panelMenu.addMenuItem("Flush...", (pClickEvent) => {
      this.runCommand(pClickEvent, pMinionId, "mine.flush");
    });
  }

  _addMenuItemMineDelete (pMenu, pMinionId, key) {
    pMenu.addMenuItem("Delete&nbsp;key...", (pClickEvent) => {
      this.runCommand(pClickEvent, pMinionId, "mine.delete \"" + key + "\"");
    });
  }
}
