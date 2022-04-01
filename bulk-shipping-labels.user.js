// ==UserScript==
// @name         Bulk print shipping labels paypal
// @namespace    https://uli.rocks
// @version      0.1
// @description  Bulk print shipping labels on paypal
// @author       Ulisse Mini
// @match        https://paypal.com/activities/*
// @icon         https://uli.rocks/profile.png
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    // NOTE: These are display block anchor tags, so I call them buttons
    const printButtons = document.querySelectorAll(
      `[title]="Print shipping label"`
    );
    printButtons.forEach((btn) => {
      btn.style.border = "2px solid red";
    });
  });
})();
