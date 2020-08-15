export class OutputToml {

  // format an object as TOML
  // returns NULL when it is not a simple object
  // i.e. no multi-line objects, no indentation here
  static _formatSimpleTOML (pValue) {

    if (pValue === null) {
      return "null";
    }

    if (pValue === undefined) {
      return "undefined";
    }

    if (typeof pValue === "boolean") {
      return pValue ? "true" : "false";
    }

    if (typeof pValue === "string") {
      return "\"" + pValue + "\"";
    }

    if (typeof pValue !== "object") {
      return String(pValue);
    }

    if (Array.isArray(pValue) && pValue.length === 0) {
      // show the brackets for an empty array a bit wider apart
      return "[ ]";
    }

    if (!Array.isArray(pValue) && Object.keys(pValue).length === 0) {
      // show the brackets for an empty object a bit wider apart
      return "{ }";
    }

    return null;
  }

  // format an object as TOML
  // based on an initial indentation and an indentation increment
  static formatTOML (pValue, pIndentLevel = 0) {

    // indent each level with this number of spaces
    // note that list items are indented with 2 spaces
    // independently of this setting to match the prefix "- "
    const indentStep = 2;

    const str = OutputToml._formatSimpleTOML(pValue);
    if (str !== null) {
      return str;
    }

    if (Array.isArray(pValue)) {
      let out = "[\n" + " ".repeat(pIndentLevel + 2);
      let separator = "";
      for (const item of pValue) {
        out += separator + OutputToml.formatTOML(item, pIndentLevel + 2);
        separator = ",\n" + " ".repeat(pIndentLevel + 2);
      }
      return out + "\n" + " ".repeat(pIndentLevel) + "]";
    }

    // regular object
    let out = "";
    let separator = "";
    for (const key of Object.keys(pValue).sort()) {
      const item = pValue[key];
      out += separator + key + ":";
      const systr = OutputToml._formatSimpleTOML(item);
      if (systr !== null) {
        out += " " + systr;
      } else if (Array.isArray(item)) {
        out += " " + OutputToml.formatTOML(item, pIndentLevel);
      } else if (typeof item === "object") {
        out += "\n" + " ".repeat(pIndentLevel + indentStep) + OutputToml.formatTOML(item, pIndentLevel + indentStep);
      } else {
        /* istanbul ignore next */
        out += "x" + OutputToml.formatTOML(item, pIndentLevel + indentStep);
      }
      separator = "\n" + " ".repeat(pIndentLevel);
    }
    return out;
  }
}
