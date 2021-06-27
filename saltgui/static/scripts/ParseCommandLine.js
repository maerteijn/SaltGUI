// Function to parse a commandline
// The line is broken into individual tokens
// Each token that is recognized as a JS type will get that type
// Otherwise the token is considered to be a string
// name-value pairs in the form "name=value" are added to the "argsObject" dictionary
// other parameters are added to the "argsArray" array
// e.g.:
//   test "1 2 3" 4 x=7 {"a":1, "b":2}
// is a command line of 5 tokens
//   string: "test"
//   string: "1 2 3"
//   number: 4
//   number: 7
//   dictionary: {"a":1, "b": 2}
// the array will be filled with 4 elements
// the dictionary will be filled with one element named "x"

export class ParseCommandLine {

  static getPatJid () {
    return /^[2-9][0-9][0-9][0-9][01][0-9][0-3][0-9][0-2][0-9][0-5][0-9][0-5][0-9][0-9][0-9][0-9][0-9][0-9][0-9]$/;
  }

  static getCommandFromCommandLine (pCommandLine) {
    const argsArray = [];
    const argsObject = {};
    ParseCommandLine.parseCommandLine(pCommandLine, argsArray, argsObject);
    return argsArray[0];
  }

  static parseCommandLine (pToRun, pArgsArray, pArgsObject) {

    const patPlaceHolder = /^"?<[a-z]+>"?/;

    // note that "none" is not case-insensitive, but "null" is
    const patNull = /^(?:None|null|Null|NULL)$/;

    const patBooleanFalse = /^(?:false|False|FALSE)$/;
    const patBooleanTrue = /^(?:true|True|TRUE)$/;

    const patInteger = /^(?:(?:0)|(?:[-+]?[1-9][0-9]*))$/;

    const patFloat = /^(?:[-+]?(?:(?:[0-9]+)|(?:[0-9]+[.][0-9]*)|(?:[0-9]*[.][0-9]+))(?:[eE][-+]?[0-9]+)?)$/;

    // just in case the user typed some extra whitespace
    // at the start of the line
    pToRun = pToRun.trim();

    while (pToRun.length > 0) {
      let name = null;

      let firstSpaceChar = pToRun.indexOf(" ");
      if (firstSpaceChar < 0) {
        firstSpaceChar = pToRun.length;
      }
      const firstEqualSign = pToRun.indexOf("=");
      if (firstEqualSign >= 0 && firstEqualSign < firstSpaceChar) {
        // we have the name of a named parameter
        name = pToRun.substr(0, firstEqualSign);
        pToRun = pToRun.substr(firstEqualSign + 1);
        if (pToRun === "" || pToRun[0] === " ") {
          return "Must have value for named parameter '" + name + "'";
        }
      }

      if (patPlaceHolder.test(pToRun)) {
        const placeHolder = pToRun.replace(/.*</, "<").replace(/>.*/, ">");
        return "Must fill in all placeholders, e.g. " + placeHolder;
      }

      // Determine whether the JSON string starts with a known
      // character for a JSON type
      let beginChar = undefined;
      let endChar = undefined;
      let objType = undefined;
      if (pToRun[0] === "{") {
        beginChar = "{";
        endChar = "}";
        objType = "dictionary";
      } else if (pToRun[0] === "[") {
        beginChar = "[";
        endChar = "]";
        objType = "array";
      } else if (pToRun.startsWith("\"\"\"")) {
        beginChar = "\"\"\"";
        endChar = "\"\"\"";
        objType = "triple-quoted-string";
      } else if (pToRun[0] === "\"") {
        // note that json does not support single-quoted strings
        beginChar = "\"";
        endChar = "\"";
        objType = "double-quoted-string";
      }

      let value;
      if (endChar && objType) {
        // The string starts with a character for a known JSON type
        let charPos = beginChar.length;
        for (;;) {
          // Try until the next closing character
          let endCharPos = pToRun.indexOf(endChar, charPos);
          if (endCharPos < 0) {
            return "No valid " + objType + " found";
          }

          // parse what we have found so far
          // the string ends with a closing character
          // but that may not be enough, e.g. "{a:{}"
          try {
            if (objType === "triple-quoted-string") {
              value = pToRun.substring(beginChar.length, endCharPos);
            } else {
              const fndStr = pToRun.substring(0, endCharPos + endChar.length);
              value = JSON.parse(fndStr);
            }
          } catch (err) {
            // the string that we tried to parse is not valid json
            // continue to add more text from the input
            charPos = endCharPos + 1;
            continue;
          }

          // the first part of the string is valid JSON
          endCharPos += endChar.length;
          if (endCharPos < pToRun.length && pToRun[endCharPos] !== " ") {
            return "Valid " + objType + ", but followed by text:" + pToRun.substring(endCharPos) + "...";
          }

          // valid JSON and not followed by strange characters
          pToRun = pToRun.substring(endCharPos);
          break;
        }
      } else {
        // everything else is a string (without quotes)
        // when we are done, we'll see whether it actually is a number
        // or any of the known constants
        let str = "";
        while (pToRun.length > 0 && pToRun[0] !== " ") {
          str += pToRun[0];
          pToRun = pToRun.substring(1);
        }

        // try to find whether the string is actually a known constant
        // or integer or float
        if (patNull.test(str)) {
          value = null;
        } else if (patBooleanFalse.test(str)) {
          value = false;
        } else if (patBooleanTrue.test(str)) {
          value = true;
        } else if (ParseCommandLine.getPatJid().test(str)) {
          // jobIds look like numbers but must be strings
          value = str;
        } else if (patInteger.test(str)) {
          value = parseInt(str, 10);
        } else if (patFloat.test(str)) {
          value = parseFloat(str);
          if (!isFinite(value)) {
            return "Numeric argument has overflowed or is infinity";
          }
        } else {
          value = str;
        }
      }

      if (name === null) {
        // anonymous parameter
        pArgsArray.push(value);
      } else if (name in pArgsObject) {
        // named parameter which already exists
        return "Duplicate named variable '" + name + "'";
      } else {
        // named parameter
        pArgsObject[name] = value;
      }

      // ignore the whitespace before the next part
      pToRun = pToRun.trim();
    }

    // succesfull (no error message return)
    return null;
  }
}
