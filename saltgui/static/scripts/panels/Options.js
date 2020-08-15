/* global document */

import {Character} from "../Character.js";
import {OutputYaml} from "../output/OutputYaml.js";
import {Panel} from "./Panel.js";
import {Router} from "../Router.js";
import {Utils} from "../Utils.js";

export class OptionsPanel extends Panel {

  constructor () {
    super("options");

    this.addTitle("Options");
    // this.addSearchButton();
    this.addHelpButton("Names 'session_*' show the values from the login session\nNames 'saltgui_*' show the values from the master file '/etc/salt/master'\nOther names are regular variables from the master file\nChanges made in this screen are valid for this session ONLY");
    this.addTable(["Name", "Value"]);

    this.options = [
      ["token", "session"],
      ["start", "session"],
      ["expire", "session"],
      ["eauth", "session"],
      ["user", "session"],
      ["perms", "session"],
      ["nodegroups", null, "(none)"],
      [
        "state-verbose", null, "true",
        [["verbose", "true", "false"]]
      ],
      [
        "state-output", null, "full",
        [["output", "full", "terse", "mixed", "changes", "full_id", "terse_id", "mixed_id", "changes_id"]]
      ],
      ["templates", null, "(none)"],
      ["public-pillars", "saltgui", "(none)"],
      ["preview-grains", "saltgui", "(none)"],
      ["hide-jobs", "saltgui", "(none)"],
      ["show-jobs", "saltgui", "(all)"],
      [
        "output-formats", "saltgui", "doc,saltguihighstate,json",
        [
          ["doc", "doc", "none:no doc"],
          ["highstate", "saltguihighstate:SaltGUI highstate", "highstate:Normal highstate", "none:No highstate"],
          ["output", "json", "nested", "yaml", "toml"]
        ]
      ],
      [
        "datetime-fraction-digits", "saltgui", "6",
        [["digits", "0", "1", "2", "3", "4", "5", "6"]]
      ],
      [
        "tooltip-mode", "saltgui", "full",
        [["mode", "full", "simple", "none"]]
      ]
    ];
  }

  _addOptionRow (pName, pCategory, pDefaultValue, pValues = null) {
    const tr = document.createElement("tr");
    tr.id = "option-" + pName;
    tr.dataset.defaultValue = pDefaultValue;

    const labelTxt = (pCategory ? pCategory + "_" : "") + pName.replace(/-/g, "_");
    const tdName = Utils.createTd("", labelTxt + ":", "option-" + pName + "-name");
    tdName.style.whiteSpace = "normal";
    tr.appendChild(tdName);

    const tdValue = Utils.createTd();
    if (pValues === null) {
      tdValue.id = "option-" + pName + "-value";
    } else {
      const span = Utils.createSpan("", "", "option-" + pName + "-value");
      tdValue.appendChild(span);

      const br1 = document.createElement("br");
      tdValue.appendChild(br1);

      const br2 = document.createElement("br");
      tdValue.appendChild(br2);

      let addSep = false;
      for (const row of pValues) {
        if (addSep) {
          const br3 = document.createElement("br");
          tdValue.appendChild(br3);
        }
        addSep = true;
        for (let i = 1; i < row.length; i++) {
          let itemText = row[i];
          let itemValue = row[i];
          const colonPos = row[i].search(":");
          if (colonPos > 0) {
            itemValue = row[i].substring(0, colonPos);
            itemText = row[i].substring(colonPos + 1);
          }

          const radio = document.createElement("input");
          radio.id = "option-" + pName + "-value-" + row[0] + "-" + itemValue;
          radio.type = "radio";
          radio.name = "option-" + pName + "-value-" + row[0];
          radio.value = itemValue;
          if (pName === "state-verbose") {
            radio.addEventListener("change", () => {
              this._newStateVerbose();
            });
          } else if (pName === "state-output") {
            radio.addEventListener("change", () => {
              this._newStateOutput();
            });
          } else if (pName === "output-formats") {
            radio.addEventListener("change", () => {
              this._newOutputFormats();
            });
          } else if (pName === "datetime-fraction-digits") {
            radio.addEventListener("change", () => {
              this._newDatetimeFractionDigits();
            });
          } else if (pName === "tooltip-mode") {
            radio.addEventListener("change", () => {
              this._newTooltipMode();
            });
          }
          tdValue.appendChild(radio);

          const label = document.createElement("label");
          label.htmlFor = radio.id;
          label.innerText = itemText;
          label.style.whiteSpace = "nowrap";
          tdValue.appendChild(label);
        }
      }
    }
    tr.appendChild(tdValue);

    const tbody = this.table.tBodies[0];
    tbody.appendChild(tr);
  }

  static _enhanceSessionStart (pSessionStart) {
    const startStr = new Date(pSessionStart * 1000);
    return pSessionStart + "\n" + startStr;
  }

  static _enhanceSessionExpire (pSessionStart, pSessionExpire) {
    const expireStr = new Date(pSessionExpire * 1000);
    const date = new Date(null);
    if (pSessionStart && pSessionExpire) {
      date.setSeconds(pSessionExpire - pSessionStart);
    }
    let durationStr = "";
    const str1 = date.toISOString();
    if (str1.startsWith("1970-01-01T")) {
      // remove the date prefix and the millisecond suffix
      durationStr = "\nduration is " + str1.substr(11, 8);
    }
    let expiresInStr = "";
    const str2 = new Date(pSessionExpire * 1000 - Date.now()).toISOString();
    if (str2.startsWith("1970-01-01T")) {
      // remove the date prefix and the millisecond suffix
      expiresInStr = "\nexpires in " + str2.substr(11, 8);
    }
    return pSessionExpire + "\n" + expireStr + durationStr + expiresInStr;
  }

  onShow () {
    // build the controls for all options
    for (const option of this.options) {
      const name = option[0];
      const category = option[1];
      const defaultValue = option[2];
      const valuesArr = option[3];
      this._addOptionRow(name, category, defaultValue, valuesArr);
    }

    const loginResponseStr = Utils.getStorageItem("session", "login-response", "{}");
    const loginResponse = JSON.parse(loginResponseStr);
    const sessionStart = loginResponse.start;

    for (const option of this.options) {
      const name = option[0];
      const category = option[1];
      const defaultValue = option[2];
      const valuesArr = option[3];

      let value;
      if (category === "session") {
        value = loginResponse[name];
      } else if (category === null) {
        value = Utils.getStorageItem("session", name.replace(/-/g, "_"));
      } else if (category === "saltgui") {
        value = Utils.getStorageItem("session", name.replace(/-/g, "_"));
      } else {
        value = category + "[" + name + "]";
      }
      if (category === "session" && name === "start") {
        value = OptionsPanel._enhanceSessionStart(value);
      } else if (category === "session" && name === "expire") {
        value = OptionsPanel._enhanceSessionExpire(sessionStart, value);
      }
      const td = this.div.querySelector("#option-" + name + "-value");
      if (name === "perms") {
        td.innerText = OutputYaml.formatYAML(value);
      } else if (category === "session") {
        td.innerText = value;
      } else {
        td.innerText = this._parseAndFormat(name, value);
      }

      // some rows only display values, skip these
      if (!valuesArr) {
        continue;
      }

      // first select the "none" values
      for (const valueArr of valuesArr) {
        const id = "option-" + name + "-value-" + valueArr[0] + "-none";
        const noneElement = document.getElementById(id);
        if (noneElement) {
          noneElement.checked = true;
        }
      }

      // select the default value when there is no selection
      if (!value) {
        value = defaultValue;
      }

      const varr = value.replace(/"/g, "").split(",");

      // then select the other values
      for (const valueArr of valuesArr) {
        for (let i = 1; i < valueArr.length; i++) {
          let label = valueArr[i];
          if (label.indexOf(":") >= 0) {
            label = label.replace(/:.*/, "");
          }
          const id = "option-" + name + "-value-" + valueArr[0] + "-" + label;
          const thisElement = document.getElementById(id);
          if (value && varr.includes(label)) {
            thisElement.checked = true;
          }
        }
      }
    }
  }

  _parseAndFormat (id, valueStr) {
    /* eslint-disable curly */
    if (valueStr === null) valueStr = undefined;
    if (valueStr === "undefined") valueStr = undefined;
    /* eslint-enable curly */
    if (valueStr === undefined) {
      const tr = this.div.querySelector("#option-" + id);
      if (tr.dataset.defaultValue) {
        return "(undefined) " + Character.RIGHTWARDS_ARROW + " " + tr.dataset.defaultValue;
      }
      return "(undefined)";
    }
    const value = JSON.parse(valueStr);
    return OutputYaml.formatYAML(value);
  }

  _isSelected (pCategory, pRow, pName) {
    const radioButtonId = "option-" + pCategory + "-value-" + pRow + "-" + pName;
    const radioButton = this.div.querySelector("#" + radioButtonId);
    return radioButton.checked;
  }

  _newStateVerbose () {
    let value = "";
    /* eslint-disable curly */
    if (this._isSelected("state-verbose", "verbose", "false")) value = "false";
    if (this._isSelected("state-verbose", "verbose", "true")) value = "true";
    /* eslint-enable curly */
    const stateVerboseTd = this.div.querySelector("#option-state-verbose-value");
    stateVerboseTd.innerText = value;
    Utils.setStorageItem("session", "state_verbose", value);
  }

  _newStateOutput () {
    let value = "";
    /* eslint-disable curly */
    if (this._isSelected("state-output", "output", "full")) value = "full";
    if (this._isSelected("state-output", "output", "terse")) value = "terse";
    if (this._isSelected("state-output", "output", "mixed")) value = "mixed";
    if (this._isSelected("state-output", "output", "changes")) value = "changes";
    if (this._isSelected("state-output", "output", "full_id")) value = "full_id";
    if (this._isSelected("state-output", "output", "terse_id")) value = "terse_id";
    if (this._isSelected("state-output", "output", "mixed_id")) value = "mixed_id";
    if (this._isSelected("state-output", "output", "changes_id")) value = "changes_id";
    /* eslint-enable curly */
    const stateOutputeTd = this.div.querySelector("#option-state-output-value");
    stateOutputeTd.innerText = value;
    Utils.setStorageItem("session", "state_output", "\"" + value + "\"");
  }

  _newOutputFormats () {
    let value = "";
    /* eslint-disable curly */
    if (this._isSelected("output-formats", "doc", "doc")) value += ",doc";
    if (this._isSelected("output-formats", "highstate", "saltguihighstate")) value += ",saltguihighstate";
    if (this._isSelected("output-formats", "highstate", "highstate")) value += ",highstate";
    if (this._isSelected("output-formats", "output", "json")) value += ",json";
    if (this._isSelected("output-formats", "output", "nested")) value += ",nested";
    if (this._isSelected("output-formats", "output", "yaml")) value += ",yaml";
    if (this._isSelected("output-formats", "output", "toml")) value += ",toml";
    value = value.replace(/^,/, "");
    /* eslint-enable curly */
    const outputFormatsTd = this.div.querySelector("#option-output-formats-value");
    outputFormatsTd.innerText = value;
    Utils.setStorageItem("session", "output_formats", "\"" + value + "\"");
    // refresh the right-hand panel based on the new option value
    Router.currentPage.stats.clearTable();
    Router.currentPage.stats.onShow();
  }

  _newDatetimeFractionDigits () {
    let value = "";
    /* eslint-disable curly */
    if (this._isSelected("datetime-fraction-digits", "digits", "0")) value = "0";
    if (this._isSelected("datetime-fraction-digits", "digits", "1")) value = "1";
    if (this._isSelected("datetime-fraction-digits", "digits", "2")) value = "2";
    if (this._isSelected("datetime-fraction-digits", "digits", "3")) value = "3";
    if (this._isSelected("datetime-fraction-digits", "digits", "4")) value = "4";
    if (this._isSelected("datetime-fraction-digits", "digits", "5")) value = "5";
    if (this._isSelected("datetime-fraction-digits", "digits", "6")) value = "6";
    /* eslint-enable curly */
    const datetimeFractionDigitsTd = this.div.querySelector("#option-datetime-fraction-digits-value");
    datetimeFractionDigitsTd.innerText = value;
    Utils.setStorageItem("session", "datetime_fraction_digits", value);
  }

  _newTooltipMode () {
    let value = "";
    /* eslint-disable curly */
    if (this._isSelected("tooltip-mode", "mode", "full")) value = "full";
    if (this._isSelected("tooltip-mode", "mode", "simple")) value = "simple";
    if (this._isSelected("tooltip-mode", "mode", "none")) value = "none";
    /* eslint-enable curly */
    const tooltipModeTd = this.div.querySelector("#option-tooltip-mode-value");
    tooltipModeTd.innerText = value;
    Utils.setStorageItem("session", "tooltip_mode", "\"" + value + "\"");
  }
}
