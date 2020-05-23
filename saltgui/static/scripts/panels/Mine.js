/* global config window */

import {DropDownMenu} from "../DropDown.js";
import {Panel} from "./Panel.js";
import {Utils} from "../Utils.js";

export class MinePanel extends Panel {

  constructor () {
    super("mine");

    this.addTitle("Mine");
    this.addSearchButton();
    this.addTable(["Minion", "Status", "Mines", "-menu-"]);
    this.setTableClickable();
    this.addMsg();
  }

  onShow () {
    const that = this;

    const wheelKeyListAllPromise = this.router.api.getWheelKeyListAll();
    const localMineValidPromise = this.router.api.getLocalMineValid();

    wheelKeyListAllPromise.then((pWheelKeyListAllData) => {
      that._handleMineWheelKeyListAll(pWheelKeyListAllData);

      localMineValidPromise.then((pLocalMineValidData) => {
        that.updateMinions(pLocalMineValidData);
      }, (pLocalMineValidMsg) => {
        const localMineValidData = {"return": [{}]};
        for (const minionId of pWheelKeyListAllData.return[0].data.return.minions) {
          localMineValidData.return[0][minionId] = JSON.stringify(pLocalMineValidMsg);
        }
        that.updateMinions(localMineValidData);
      });
    }, (pWheelKeyListAllMsg) => {
      that._handleMineWheelKeyListAll(JSON.stringify(pWheelKeyListAllMsg));
    });
  }

  _handleMineWheelKeyListAll (pWheelKeyListAllData) {
    if (this.showErrorRowInstead(pWheelKeyListAllData)) {
      return;
    }

    const keys = pWheelKeyListAllData.return[0].data.return;

    const minionIds = keys.minions.sort();
    for (const minionId of minionIds) {
      this.addMinion(minionId, 1);

      // preliminary dropdown menu
      const minionTr = this.table.querySelector("#" + Utils.getIdFromMinionId(minionId));
      const menu = new DropDownMenu(minionTr);
      MinePanel._addMenuValidShowMine(menu, minionId);

      minionTr.addEventListener("click", () => {
        window.location.assign(config.NAV_URL + "/mineminion?minionid=" + encodeURIComponent(minionId));
      });
    }

    const msgDiv = this.div.querySelector(".msg");
    const txt = Utils.txtZeroOneMany(minionIds.length,
      "No minions", "{0} minion", "{0} minions");
    msgDiv.innerText = txt;
  }

  updateOfflineMinion (pMinionId, pMinionsDict) {
    super.updateOfflineMinion(pMinionId, pMinionsDict);

    const minionTr = this.table.querySelector("#" + Utils.getIdFromMinionId(pMinionId));

    // force same columns on all rows
    minionTr.appendChild(Utils.createTd("mineinfo", ""));
    minionTr.appendChild(Utils.createTd("run-command-button", ""));
  }

  updateMinion (pMinionData, pMinionId, pAllMinionsMine) {
    super.updateMinion(null, pMinionId, pAllMinionsMine);

    const minionTr = this.table.querySelector("#" + Utils.getIdFromMinionId(pMinionId));

    if (pMinionData === null) {
      const mineInfoText = "no mines";
      const mineInfoTd = Utils.createTd("mineinfo", mineInfoText);
      mineInfoTd.setAttribute("sorttable_customkey", 0);
      minionTr.appendChild(mineInfoTd);
    } else if (typeof pMinionData === "object") {
      const cnt = Object.keys(pMinionData).length;
      const mineInfoText = Utils.txtZeroOneMany(cnt, "no mines", "{0} mine", "{0} mines");
      const mineInfoTd = Utils.createTd("mineinfo", mineInfoText);
      mineInfoTd.setAttribute("sorttable_customkey", cnt);
      minionTr.appendChild(mineInfoTd);
    } else {
      const mineInfoTd = Utils.createTd("", "");
      Utils.addErrorToTableCell(mineInfoTd, pMinionData);
      minionTr.appendChild(mineInfoTd);
    }

    const menu = new DropDownMenu(minionTr);
    MinePanel._addMenuValidShowMine(menu, pMinionId);

    minionTr.addEventListener("click", () => {
      window.location.assign(config.NAV_URL + "/mineminion?minionid=" + encodeURIComponent(pMinionId));
    });
  }

  static _addMenuValidShowMine (pMenu, pMinionId) {
    pMenu.addMenuItem("Show&nbsp;mine", () => {
      window.location.assign(config.NAV_URL + "/mineminion?minionid=" + encodeURIComponent(pMinionId));
    });
  }
}
