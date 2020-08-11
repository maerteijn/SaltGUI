import {DropDownMenu} from "./DropDown.js";

export class DropDownMenuRadio extends DropDownMenu {
  constructor (pParentElement) {
    super(pParentElement);
    this.value = null;
    this.defaultValue = null;
  }

  getValue () {
    if (this.value === null) {
      return this.defaultValue;
    }
    return this.value;
  }

  setValue (pValue) {
    this.value = pValue;
  }

  setDefaultValue (pDefaultValue) {
    this.defaultValue = pDefaultValue;
  }

  _verifyMenuItem (pMenuItem) {
    let title;
    if (typeof pMenuItem._title === "string") {
      title = pMenuItem._title;
    } else {
      title = pMenuItem._title(pMenuItem);
    }

    if (title === null) {
      // menu item will be hidden
    } else if (pMenuItem._value === this.value) {
      // 25CF = BLACK CIRCLE
      title = "\u25CF&nbsp;" + title;
    } else if (this.value === null && pMenuItem._value === this.defaultValue) {
      // 25CB = WHITE CIRCLE
      title = "\u25CB&nbsp;" + title;
    }
    return title;
  }

  _selectCallback (pValue, pTitle, pMenuTitle) {

    this.value = pValue;

    // show the chosen value
    if (pMenuTitle === null) {
      // caller can specify a more specific menu title
      // usually an abbreviation of the chosen menu item
      if (typeof pTitle !== "string") {
        pTitle = pTitle();
      }
      this.setTitle(pTitle);
    } else {
      this.setTitle(pMenuTitle);
    }
  }

  addMenuItemRadio (pValue, pTitle, pMenuTitle = null) {
    const menuItem = super.addMenuItem(pTitle, () => {
      this._selectCallback(pValue, pTitle, pMenuTitle);
    }, (pMenuItem) => this._verifyMenuItem(pMenuItem));

    menuItem._value = pValue;
  }
}
