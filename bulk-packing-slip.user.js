// ==UserScript==
// @name         Bulk print packing slips
// @namespace    https://uli.rocks
// @version      0.2
// @description  Bulk print packing slips on paypal
// @author       Ulisse Mini
// @match        https://www.paypal.com/*
// @icon         https://uli.rocks/profile.png
// @grant        GM_saveTab
// @grant        GM_getTab
// ==/UserScript==

(function () {
  "use strict";

  // Click person
  // Print packing slip
  // Click Print and print on printer (or save pdf and bulk print later)
  // Back 3 times

  function $$(x) {
    return Array.from(document.querySelectorAll(x));
  }
  function $(x) {
    return document.querySelector(x);
  }

  function hookAll() {
    // Select names
    const names = $$(`td a[href^="/activity/payment/"]`);
    names.forEach((name) => {
      name.style.border = "2px solid red";
      // TODO: Add button to print packing slip
    });
  }

  const url = document.location.href;
  if (url.match(/.*\/activities\/.*/)) {
    // Hook all the names
    setInterval(hookAll, 1000);
  } else if (url.match(/.*\/activity\/payment\/.*/)) {
    // Now we're on /activity/payment/<id>, click "Print packing slip"
    $(`a[href^="/shiplabel/packingslip/"]`).click();
  } else if (url.match(/.*\/shiplabel\/packingslip\/.*/)) {
    // Now we're on /shiplabel/packingslip/<id>, click print
    $$("span")
      .find((s) => s.textContent === "Print")
      .click();
  }
})();
