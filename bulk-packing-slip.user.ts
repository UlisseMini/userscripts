// ==UserScript==
// @name         Bulk print packing slips
// @namespace    https://uli.rocks
// @version      0.9
// @description  Bulk print packing slips on paypal
// @author       Ulisse Mini
// @match        https://www.paypal.com/*
// @icon         https://uli.rocks/profile.png
// @grant        GM_saveTab
// @grant        GM_getTab
// ==/UserScript==

(function () {
  "use strict";

  // Selection helpers
  const $$ = (x: string): HTMLElement[] =>
    Array.from(document.querySelectorAll(x));
  const $ = (x: string): HTMLElement | null => document.querySelector(x);
  const select = {
    paymentNames: () =>
      $$(`td a[href^="/activity/payment/"]`) as HTMLAnchorElement[],
  };
  // Get payment id from payment name element
  const paymentId = (a: HTMLAnchorElement) => a.href.match(/\w+$/)![0];

  // Run function until success, more reliable then DOMContentLoaded.
  function untilSuccess(fn: () => boolean) {
    const id = setInterval(() => {
      if (fn()) clearInterval(id);
    }, 200);
  }

  // Storage
  const set = (k: string, v: any) =>
    localStorage.setItem("uli-" + k, JSON.stringify(v));
  const get = (k: string) =>
    JSON.parse(localStorage.getItem("uli-" + k) || "null");

  // Have we clicked a payment? (TODO: Replace with havePrinted; make editable)
  const setClicked = (id: string) => {
    const clicked = get("clicked") || [];
    !clicked.includes(id) && clicked.push(id);
    set("clicked", clicked);
  };
  const hasBeenClicked = (id: string) => (get("clicked") || []).includes(id);

  // UI for controlling the running script
  const createButton = (text: string, onclick: () => void) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.onclick = onclick;
    return button;
  };

  const addButton = (text: string, onclick: () => void): boolean => {
    const button = createButton(text, onclick);
    return Boolean(
      $(".SearchFilterContainer")?.firstChild?.childNodes[1].appendChild(button)
    );
  };

  // Called repeatadly. we need hooked so we don't addEventListener twice.
  let hooked: { [href: string]: boolean } = {};
  function hookPaymentNames() {
    const names = select.paymentNames();
    names.forEach((name: HTMLAnchorElement) => {
      // Color based on hasBeenClicked
      const id = paymentId(name);
      const color = hasBeenClicked(id) ? "red" : "green";
      name.style.border = "1px solid " + color;

      // Only hook listener once
      if (hooked[name.href]) return;
      hooked[name.href] = true;

      name.addEventListener("click", () => setClicked(id));
    });
  }

  let loop: number | null;
  function cancelPrint() {
    if (loop) clearInterval(loop);
  }
  function startPrintAll() {
    const urlPrefix = "https://www.paypal.com/shiplabel/packingslip/";
    const linkTags = select.paymentNames();
    const ids = linkTags.map(paymentId).filter((id) => !hasBeenClicked(id));

    let i = 0;
    let win: Window | null;
    loop = setInterval(() => {
      if (!win) {
        win = window.open(urlPrefix + ids[i]);
        setClicked(ids[i]);
      } else if (win.closed) {
        win = null;
        i++;
        if (i >= ids.length) {
          cancelPrint();
        }
      }
    }, 200);
  }

  const url = document.location.href;
  if (url.match(/.*\/activities\/.*/)) {
    setInterval(hookPaymentNames, 1000);
    untilSuccess(() => addButton("Print all slips", startPrintAll));
    untilSuccess(() => addButton("Cancel print all", cancelPrint));
  } else if (url.match(/.*\/shiplabel\/packingslip\/.*/)) {
    // Now we're on /shiplabel/packingslip/<id>. Click print then close the window
    untilSuccess(() => {
      const el = $$("span").find((s) => s.textContent === "Print");
      if (el) {
        window.addEventListener("afterprint", () => window.close());
        el.click();
        return true;
      }

      return false;
    });
  }
})();
