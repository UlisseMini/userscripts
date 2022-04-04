// ==UserScript==
// @name         Bulk print packing slips
// @namespace    https://uli.rocks
// @version      0.5
// @description  Bulk print packing slips on paypal
// @author       Ulisse Mini
// @match        https://www.paypal.com/*
// @icon         https://uli.rocks/profile.png
// @grant        GM_saveTab
// @grant        GM_getTab
// ==/UserScript==

// Print to files at once, once in files normal file management can be used
// to deal with duplicates
//
// Show which packing slips have been printed in ui

(function () {
  "use strict";

  // Helpers
  const $$ = (x) => Array.from(document.querySelectorAll(x));
  const $ = (x) => document.querySelector(x);
  const set = (k, v) => localStorage.setItem("uli-" + k, JSON.stringify(v));
  const get = (k) => JSON.stringify(localStorage.getItem("uli-" + k));

  function untilSuccess(fn) {
    const id = setInterval(() => {
      try {
        fn();
        clearInterval(id);
      } catch (e) {
        console.error(e);
      }
    }, 200);
  }

  const setClicked = (id) => {
    const clicked = get("clicked") || [];
    !clicked.includes(id) && clicked.push(id);
    set("clicked", clicked);
  };

  const hasBeenClicked = (id) => {
    (get("clicked") || []).includes(id);
  };

  const getId = (a) => a.href.match(/\/(w+)$/)[1];

  const addButton = (text, onclick) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.onclick = onclick;
    $(".SearchFilterContainer").firstChild.children[1].appendChild(button);
  };

  let hooked = {};
  function hookAll() {
    // Select names
    const names = $$(`td a[href^="/activity/payment/"]`);
    names.forEach((name) => {
      if (hooked[name.href]) return;
      hooked[name.href] = true;

      name.style.borderBottom = "2px solid red";
      name.addEventListener("click", (e) => setClicked(getId(e.target)));
    });
  }

  function printAll() {
    const urlPrefix = "https://www.paypal.com/shiplabel/packingslip/";
    const ids = $$('td a[href^="/activity/payment/"]')
      .map(getId)
      .filter((id) => !hasBeenClicked(id));

    let i = 0;
    let win = null;
    const loop = setInterval(() => {
      if (!win) {
        win = window.open(urlPrefix + ids[i]);
        setClicked(ids[i]);
      }

      if (win.closed) {
        win = null;
        i++;
        if (i >= ids.length) {
          clearInterval(loop);
        }
      }
    }, 200);
  }

  const url = document.location.href;
  if (url.match(/.*\/activities\/.*/)) {
    setInterval(hookAll, 1000);
    untilSuccess(() => addButton("Print all slips", printAll));
  } else if (url.match(/.*\/shiplabel\/packingslip\/.*/)) {
    // Now we're on /shiplabel/packingslip/<id>, so print
    untilSuccess(() => {
      if ($$("span").find((s) => s.textContent === "Print")) {
        // dom has loaded, print then close the window
        window.print();
        window.close();
      }
    });
  }
})();
