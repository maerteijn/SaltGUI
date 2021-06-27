/* global console document Hilitor window */

import {Character} from "./Character.js";
import {DropDownMenuCheckbox} from "./DropDownCheckbox.js";

export class Utils {

  // functions for URL parameters

  static _getQueryParam2 (pUrl, pName) {
    const hashPos = pUrl.indexOf("#");
    if (hashPos > 0) {
      pUrl = pUrl.substring(0, hashPos);
    }
    const questionmarkPos = pUrl.indexOf("?");
    if (questionmarkPos < 0) {
      return undefined;
    }
    const parameters = pUrl.slice(questionmarkPos + 1).split("&");
    for (const parameter of parameters) {
      const namevalue = parameter.split("=");
      if (namevalue.length !== 2) {
        continue;
      }
      if (namevalue[0] === pName) {
        return namevalue[1];
      }
    }
    return undefined;
  }

  static getQueryParam (pName) {
    let theWindow = null;
    try {
      theWindow = window;
    } catch (error) {
      // VOID
    }
    if (!theWindow || !theWindow.location) {
      return undefined;
    }
    /* istanbul ignore next */
    return Utils._getQueryParam2(theWindow.location.href, pName);
  }

  // functions for storage handling

  static _getStorage (pStorage) {
    // "window" is not defined during unit testing
    try {
      /* eslint-disable no-unused-vars */
      const theWindow = window;
      /* eslint-enable no-unused-vars */
    } catch (error) {
      return null;
    }
    /* istanbul ignore next */
    if (pStorage === "local") {
      return window.localStorage;
    }
    /* istanbul ignore next */
    if (pStorage === "session") {
      return window.sessionStorage;
    }
    /* istanbul ignore next */
    console.error("UNKNOWN STORAGE TYPE", pStorage);
    /* istanbul ignore next */
    return null;
  }

  static getStorageItem (pStorage, pKeyName, pDefaultValue = null) {
    const storage = Utils._getStorage(pStorage);
    if (!storage) {
      console.log("getStorageItem", pStorage, pKeyName);
      return pDefaultValue;
    }
    /* istanbul ignore next */
    const value = storage.getItem(pKeyName);
    // console.log("getStorageItem", pStorage, pKeyName, pDefaultValue, "-->", typeof value, value);
    /* istanbul ignore next */
    if (value === null) {
      return pDefaultValue;
    }
    /* istanbul ignore next */
    if (value === "undefined") {
      return pDefaultValue;
    }
    /* istanbul ignore next */
    return value;
  }

  static setStorageItem (pStorage, pKeyName, pValue) {
    const storage = Utils._getStorage(pStorage);
    if (!storage) {
      console.log("setStorageItem", pStorage, pKeyName, pValue);
      return;
    }
    // console.log("setStorageItem", pStorage, pKeyName, pValue);
    /* istanbul ignore next */
    storage.setItem(pKeyName, pValue);
  }

  static clearStorage (pStorage) {
    const storage = Utils._getStorage(pStorage);
    if (!storage) {
      console.log("clearStorage", pStorage);
      return;
    }
    // console.log("clearStorage", pStorage);
    /* istanbul ignore next */
    storage.clear();
  }

  // other functions

  static addToolTip (pTooltipHost, pTooltipText, pStyle = "bottom-center") {

    // Users may want to switch this on to improve browser performance
    const toolTipMode = Utils.getStorageItem("session", "tooltip_mode");

    if (toolTipMode === "none") {
      return;
    }

    if (toolTipMode === "simple") {
      pTooltipHost.setAttribute("title", pTooltipText);
      return;
    }

    // null or "full" (or anything else)
    const tooltipSpan = Utils.createSpan("", pTooltipText);
    tooltipSpan.classList.add("tooltip-text");
    tooltipSpan.classList.add("tooltip-text-" + pStyle);
    pTooltipHost.classList.add("tooltip");

    // remove the old tooltip...
    for (let i = pTooltipHost.children.length - 1; i >= 0; i--) {
      const child = pTooltipHost.children[i];
      if (child.classList.contains("tooltip-text")) {
        pTooltipHost.removeChild(child);
      }
    }

    // ...then add the new tooltip
    pTooltipHost.appendChild(tooltipSpan);
  }

  static addErrorToTableCell (pTd, pErrorMessage) {
    const span = Utils.createSpan("", "(error)");
    Utils.addToolTip(span, pErrorMessage, "bottom-left");
    pTd.appendChild(span);
  }

  static _hasTextContent (pElement, pSearchText, pCaseSensitiveFlag) {

    // why?
    if (pElement.classList && pElement.classList.contains("run-command-button")) {
      return false;
    }

    let found = false;
    for (const childNode of pElement.childNodes) {
      const searchResult = Utils._hasTextContent(childNode, pSearchText, pCaseSensitiveFlag);
      if (searchResult === 2) {
        return 2;
      }
      if (searchResult === 1) {
        found = true;
      }
    }
    if (found) {
      return 1;
    }

    // NODE_TEXT
    if (pElement.nodeType !== 3) {
      return 0;
    }

    let textValue = pElement.textContent;
    if (typeof pSearchText === "string") {
      if (!pCaseSensitiveFlag) {
        textValue = textValue.toUpperCase();
      }
      return textValue.includes(pSearchText) ? 1 : 0;
    }

    // then it is a RegExp
    const regs = pSearchText.exec(textValue);
    if (!regs) {
      return 0;
    }
    return regs[0].length > 0 ? 1 : 2;
  }

  static makeSearchBox (pSearchButton, pTable, pFieldList = null) {

    const div = Utils.createDiv("search-box", "");
    div.style.display = "none";

    const menuAndFieldDiv = Utils.createDiv("search-menu-and-field", "");

    const searchOptionsMenu = new DropDownMenuCheckbox(menuAndFieldDiv);

    const input = document.createElement("input");
    input.type = "text";
    input.classList.add("filter-text");
    input.placeholder = Character.LEFT_POINTING_MAGNIFYING_GLASS_COLOUR;
    if (pFieldList) {
      input.setAttribute("list", pFieldList);
    }
    menuAndFieldDiv.append(input);

    div.append(menuAndFieldDiv);

    const errorDiv = Utils.createDiv("search-error", "");
    errorDiv.style.display = "none";
    div.append(errorDiv);

    searchOptionsMenu.addMenuItemCheckbox(
      "Case sensitive", (ev) => {
        Utils._updateSearchOption(ev, pTable, searchOptionsMenu, input);
      });
    searchOptionsMenu.addMenuItemCheckbox(
      "Regular expression", (ev) => {
        Utils._updateSearchOption(ev, pTable, searchOptionsMenu, input);
      });
    searchOptionsMenu.addMenuItemCheckbox(
      "Invert search", (ev) => {
        Utils._updateSearchOption(ev, pTable, searchOptionsMenu, input);
      });

    // make the search function active
    pSearchButton.onclick = () => {
      Utils.hideShowTableSearchBar(div, pTable);
    };

    return div;
  }

  static _updateSearchOption (ev, pTable, pSearchOptionsMenu, pInput) {
    ev.target._value = !ev.target._value;

    let menuItemText = ev.target.innerText;
    menuItemText = menuItemText.replace(/^. /, "");
    if (ev.target._value === true) {
      menuItemText = Character.HEAVY_CHECK_MARK + " " + menuItemText;
    }
    ev.target.innerText = menuItemText;

    Utils._updateTableFilter(
      pTable,
      pInput.value,
      pSearchOptionsMenu.menuDropdownContent);

    let placeholder = Character.LEFT_POINTING_MAGNIFYING_GLASS_COLOUR;
    if (pSearchOptionsMenu.menuDropdownContent.childNodes[0]._value === true) {
      placeholder += " caseSensitive";
    }
    if (pSearchOptionsMenu.menuDropdownContent.childNodes[1]._value === true) {
      placeholder += " regExp";
    }
    if (pSearchOptionsMenu.menuDropdownContent.childNodes[2]._value === true) {
      placeholder += " invertSearch";
    }
    pInput.placeholder = placeholder;
  }

  static addTableHelp (pStartElement, pHelpText, pStyle = "bottom-right") {
    const helpButton = pStartElement.querySelector("#help");
    helpButton.classList.add("search-button");
    Utils.addToolTip(helpButton, pHelpText, pStyle);
  }

  static hideShowTableSearchBar (pSearchBlock, pTable, pAction = "toggle") {
    const startElement = pTable.parentElement;

    // remove all highlights
    const searchInSelector = pTable.tagName === "TABLE" ? "tbody" : "";
    const hilitor = new Hilitor(pTable, searchInSelector);
    hilitor.remove();

    // show rows in all tables
    const allFM = pTable.querySelectorAll(".no-filter-match");
    for (const fm of allFM) {
      fm.classList.remove("no-filter-match");
    }

    const menuItems = startElement.querySelector(".search-box .menu-dropdown-content");

    // hide/show search box (the block may become more complicated later)
    const input = pSearchBlock.querySelector("input");
    input.onkeyup = (ev) => {
      if (ev.key === "Escape") {
        Utils._updateTableFilter(pTable, "", menuItems);
        Utils.hideShowTableSearchBar(pSearchBlock, pTable);
        // return;
      }
    };
    input.oninput = () => {
      Utils._updateTableFilter(pTable, input.value, menuItems);
    };

    pTable.parentElement.insertBefore(pSearchBlock, pTable);
    if (pAction === "refresh" && pSearchBlock.style.display === "none") {
      Utils._updateTableFilter(pTable, "", menuItems);
    } else if (pAction === "refresh") {
      Utils._updateTableFilter(pTable, input.value, menuItems);
    } else if (pSearchBlock.style.display === "none") {
      Utils._updateTableFilter(pTable, input.value, menuItems);
      pSearchBlock.style.display = "";
    } else {
      Utils._updateTableFilter(pTable, "", menuItems);
      pSearchBlock.style.display = "none";
    }
    input.focus();
  }

  static _updateTableFilter (pTable, pSearchText, pMenuItems) {
    // remove highlighting before re-comparing
    // as it affects the texts
    const searchInSelector = pTable.tagName === "TABLE" ? "tbody" : "";
    const hilitor = new Hilitor(pTable, searchInSelector);
    hilitor.remove();

    // values may be undefined, so convert to proper boolean
    const caseSensitiveFlag = pMenuItems.childNodes[0]._value === true;
    const regExpFlag = pMenuItems.childNodes[1]._value === true;
    let invertFlag = pMenuItems.childNodes[2]._value === true;

    // otherwise everything is immediatelly hidden
    if (invertFlag && !pSearchText) {
      invertFlag = false;
    }

    // find text
    if (!caseSensitiveFlag && !regExpFlag) {
      pSearchText = pSearchText.toUpperCase();
    }

    let regexp = undefined;

    const errorBox = pTable.parentElement.querySelector(".search-error");
    if (regExpFlag) {
      try {
        regexp = new RegExp(pSearchText, caseSensitiveFlag ? "" : "i");
      } catch (err) {
        errorBox.innerText = err.message;
        errorBox.style.display = "";
        return;
      }
    }
    errorBox.style.display = "none";

    const searchParam = regExpFlag ? regexp : pSearchText;
    let hasEmptyMatches = false;
    let hasNonEmptyMatches = false;
    const blocks = pTable.tagName === "TABLE" ? pTable.tBodies[0].rows : pTable.children;
    for (const row of blocks) {
      if (row.classList.contains("no-search")) {
        continue;
      }
      let show = false;
      const items = row.tagName === "TR" ? row.cells : [row];
      for (const cell of items) {
        // do not use "innerText"
        // that one does not handle hidden text
        const res = Utils._hasTextContent(cell, searchParam, caseSensitiveFlag);
        if (res === 1) {
          hasNonEmptyMatches = true;
        }
        if (res === 2) {
          hasEmptyMatches = true;
        }
        // don't exit the loop, there might also be empty matches
        if (res) {
          show = true;
        }
      }
      if (invertFlag) {
        show = !show;
      }
      if (show) {
        row.classList.remove("no-filter-match");
      } else {
        row.classList.add("no-filter-match");
      }
    }
    if (pSearchText && hasEmptyMatches) {
      const indicator = hasNonEmptyMatches ? "also" : "only";
      errorBox.innerText = "warning: there were " + indicator + " empty matches, highlighting is not performed";
      errorBox.style.display = "";
      return;
    }

    // show the result
    hilitor.setMatchType("open");
    hilitor.setEndRegExp(/^$/);
    hilitor.setBreakRegExp(/^$/);

    let pattern;
    if (regExpFlag) {
      pattern = pSearchText;
    } else {
      // turn the text into a regexp
      pattern = "";
      for (const chr of pSearchText) {
        // prevent accidental construction of character classes
        /* eslint-disable no-extra-parens */
        if ((chr >= "A" && chr <= "Z") || (chr >= "a" && chr <= "z") || (chr >= "0" && chr <= "9")) {
          pattern += chr;
        } else {
          pattern += "\\" + chr;
        }
        /* eslint-enable no-extra-parens */
      }
    }

    hilitor.apply(pattern, caseSensitiveFlag);
  }

  static txtZeroOneMany (pCnt, pZeroText, pOneText, pManyText) {
    let txt = pManyText;
    if (pCnt === 0 || pCnt === undefined) {
      txt = pZeroText;
    } else if (pCnt === 1) {
      txt = pOneText;
    }
    txt = txt.replace("{0}", pCnt);
    return txt;
  }

  // MinionIds cannot directly be used as IDs for HTML elements
  // the id may contain characters that are not allowed in an ID
  // btoa is the base64 encoder
  static getIdFromMinionId (pMinionId) {
    // prevent eslint: A regular expression literal can be confused with '/='
    const patEqualSigns = /[=]=*/;
    return "m" + window.btoa(pMinionId).replace(patEqualSigns, "");
  }

  // JobIds are in the format 20190529175411210984
  // so just adding a prefix is sufficient
  static getIdFromJobId (pJobId) {
    return "j" + pJobId;
  }

  static isMultiLineString (pStr) {
    if (pStr.includes("\r")) {
      return true;
    }
    if (pStr.includes("\n")) {
      return true;
    }
    return false;
  }

  static createJobStatusSpan (pJobId, pInitialDisplay) {
    const span = Utils.createSpan("", "", "status" + pJobId);
    span.innerText = Character.CLOCKWISE_OPEN_CIRCLE_ARROW + Character.NO_BREAK_SPACE;
    if (!pInitialDisplay) {
      span.style.display = "none";
    }
    span.style.fontWeight = "bold";
    return span;
  }

  static createTd (pClassName, pInnerText, pId) {
    const td = document.createElement("td");
    if (pId) {
      td.id = pId;
    }
    if (pClassName) {
      td.className = pClassName;
    }
    if (pInnerText) {
      td.innerText = pInnerText;
    }
    return td;
  }

  static createDiv (pClassName, pInnerText, pId) {
    const div = document.createElement("div");
    if (pId) {
      div.id = pId;
    }
    if (pClassName) {
      div.className = pClassName;
    }
    if (pInnerText) {
      div.innerText = pInnerText;
    }
    return div;
  }

  static createSpan (pClassName, pInnerText, pId) {
    const span = document.createElement("span");
    if (pId) {
      span.id = pId;
    }
    if (pClassName) {
      span.className = pClassName;
    }
    if (pInnerText) {
      span.innerText = pInnerText;
    }
    return span;
  }
}
