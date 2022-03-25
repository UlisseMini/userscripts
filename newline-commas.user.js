// ==UserScript==
// @name         Newlines to comma paste
// @namespace    https://uli.rocks
// @version      0.1
// @description  Replace newlines with commas when pasting into input tags
// @author       Ulisse Mini
// @match        *://*/*
// @icon         https://uli.rocks/profile.png
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  window.addEventListener("paste", (e) => {
    // Only add commas when pasting to input elements
    if (e.target.tagName != "INPUT") {
      return;
    }

    // Prevent default paste behavior
    e.stopPropagation();
    e.preventDefault();

    // Get clipboard text and paste with commas
    const clipText = e.clipboardData.getData("text");
    const text = clipText.replace(/\n+/g, ", ");

    // Replace the text in the input element
    e.target.focus(); // probably focused, but do this to be sure
    document.execCommand("insertText", false, text);
  });
})();
