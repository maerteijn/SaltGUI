import {Character} from "./Character.js";
import {Utils} from "./Utils.js";

// each menu item has a 2 properties
// 1: the title
//    menu items that are always useable are just plain text
//    but it may be a callback function which:
//    a) sets the title using pMenuItem.innerText = "xyz"
//    b) arranges the visibility using pMenuItem.style.display = true/false
// 2: the callback function
//    called when the menu item is selected: (pClickEvent) => { ... }
// all menu items are re-validated when the menu pops up
// when all menu items are invisible, the menu-button must be made invisible
// since this can happen at any time, this cannot be done when the menu is shown
// worse, since the menu button may be invisible, thave event may never happen
// call (DropDownMenuInstance).verifyApp() to show/hide the menu button based
// on the visibility of its menu items. when all menu items are hidden, so is
// the menu. when at least one item is visible, the menu is visible
// remember to call verifyApp() when that is potentially the case

export class DropDownMenu {

  // Creates an empty dropdown menu
  // The visual clue for the menu is added to the given element
  constructor (pParentElement) {

    // allow reduced code on the caller side
    if (pParentElement.tagName === "TR") {
      const td = Utils.createTd();
      pParentElement.appendChild(td);
      pParentElement = td;
    }

    this.menuDropdown = Utils.createDiv("run-command-button");
    this.menuDropdown.classList.add("no-search");

    if (pParentElement.id === "cmd-box") {
      this.menuButton = Utils.createDiv("menu-dropdown", Character.A_BOOK);
    } else if (pParentElement.classList && pParentElement.classList.contains("minion-output")) {
      this.menuButton = Utils.createSpan("menu-dropdown", Character.CH_HAMBURGER);
    } else {
      // assume it will be a command menu
      this.menuButton = Utils.createDiv("menu-dropdown", Character.CH_HAMBURGER);
    }
    this.menuButton.addEventListener("click", (pClickEvent) => {
      // better support for touch screens where user touch
      // the menu button instead of hovering over it
      pClickEvent.stopPropagation();
    });

    // hide the menu until it receives menu-items
    this.verifyAll();

    this.menuDropdown.appendChild(this.menuButton);
    this.menuDropdownContent = Utils.createDiv("menu-dropdown-content");
    this.menuDropdown.appendChild(this.menuDropdownContent);
    this.menuDropdown.addEventListener("mouseenter", () => {
      this.verifyAll();
    });
    pParentElement.appendChild(this.menuDropdown);
  }

  verifyAll () {
    let visibleCount = 0;
    if (this.menuDropdownContent) {
      for (const chld of this.menuDropdownContent.children) {
        const verifyCallBack = chld.verifyCallBack;
        if (verifyCallBack) {
          const title = verifyCallBack(chld);
          if (title === null) {
            chld.style.display = "none";
            continue;
          }
          chld.innerText = DropDownMenu._sanitizeMenuItemTitle(title);
          chld.style.removeProperty("display");
        }
        visibleCount += 1;
      }
    }
    // hide the menu when it has no visible menu-items
    const displayVisible = this.menuDropdown.tagName === "TD" ? "table-cell" : "inline-block";
    const displayInvisible = "none";
    this.menuDropdown.style.display = visibleCount > 0 ? displayVisible : displayInvisible;
  }

  static _sanitizeMenuItemTitle (pTitle) {
    return pTitle.
      replace(" ", Character.NO_BREAK_SPACE).
      replace("-", Character.NON_BREAKING_HYPHEN).
      replace("...", Character.HORIZONTAL_ELLIPSIS);
  }

  // Add a menu item at the end of this dropdown menu
  // Runs the given callback function when selected
  // When the title is actually a function then this
  // function is called each time the menu opens
  // This allows dynamic menuitem titles (use menuitem.innerText)
  // or visibility (use menuitem.style.display = "none"/"inline-block")
  addMenuItem (pTitle, pCallBack, pValue) {
    const button = Utils.createDiv("run-command-button", "...");
    if (pValue) {
      button._value = pValue;
    }
    if (typeof pTitle === "string") {
      button.innerText = DropDownMenu._sanitizeMenuItemTitle(pTitle);
    } else {
      button.verifyCallBack = pTitle;
    }
    button.addEventListener("click", (pClickEvent) => {
      pClickEvent.target.parentElement.style.display = "none";
      setTimeout(() => {
        pClickEvent.target.parentElement.style.display = "";
      }, 500);
      this._callback(pClickEvent, pCallBack, pValue);
    });
    this.menuDropdownContent.appendChild(button);
    this.verifyAll();
    return button;
  }

  _callback (pClickEvent, pCallBack, pValue) {
    this._value = pValue;
    pCallBack(pClickEvent);
    pClickEvent.stopPropagation();
    // just in case the menu remains visible
    // and has items that change visibility
    this.verifyAll();
  }

  setTitle (pTitle) {
    // Setting the title implies that we are interested
    // in the menu values, rather than their actions.
    // Use a slightly different clue for that.
    this.menuButton.innerText = DropDownMenu._sanitizeMenuItemTitle(pTitle + " " + Character.BLACK_DOWN_POINTING_TRIANGLE);
  }

  __showMenu () {
    this.menuDropdown.style.display = "inline-block";
  }

  __hideMenu () {
    this.menuDropdown.style.display = "none";
  }

  clearMenu () {
    while (this.menuDropdownContent.firstChild) {
      this.menuDropdownContent.removeChild(this.menuDropdownContent.firstChild);
    }
  }
}
