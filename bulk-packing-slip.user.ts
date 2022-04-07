// ==UserScript==
// @name         Bulk print packing slips
// @namespace    https://uli.rocks
// @version      1.0
// @description  Bulk print packing slips on paypal
// @author       Ulisse Mini
// @match        https://www.paypal.com/*
// @icon         https://uli.rocks/profile.png
// @grant        GM_saveTab
// @grant        GM_getTab
// ==/UserScript==

// TODO: Edit printed users, export, save more robustly then localStorage

(function () {
  "use strict";

  // Selection helpers
  const $$ = (x: string): HTMLElement[] =>
    Array.from(document.querySelectorAll(x));
  const $ = (x: string): HTMLElement | null => document.querySelector(x);
  const select = {
    paymentNames: () =>
      $$(`td a[href*="/activity/payment/"]`) as HTMLAnchorElement[],
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
  const set = (k: string, v: any) => {
    localStorage.setItem("uli-" + k, JSON.stringify(v));
  };
  const get = (k: string) =>
    JSON.parse(localStorage.getItem("uli-" + k) || "null");

  const setPrintedSubs: { [id: string]: (printed: boolean) => void } = {};
  const setPrinted = (id: string, printed: boolean) => {
    const clicked = new Set(get("clicked") || []);
    printed ? clicked.add(id) : clicked.delete(id);
    // need Array.from since Set isn't directly serializable
    set("clicked", Array.from(clicked));

    if (setPrintedSubs[id]) setPrintedSubs[id](printed);
  };
  const hasBeenPrinted = (id: string) => (get("clicked") || []).includes(id);

  // UI for controlling the running script
  const createButton = (text: string, onclick: () => void) => {
    const button = document.createElement("button");
    button.textContent = text;
    button.onclick = onclick;
    button.style.margin = "1em";
    return button;
  };

  const addButton = (text: string, onclick: () => void): boolean => {
    const button = createButton(text, onclick);
    const parent = $(".SearchFilterContainer .filter-duration-container");
    if (parent) {
      parent.appendChild(button);
      return true;
    }
    return false;
  };

  function hookPaymentNames() {
    const names = select.paymentNames();
    names.forEach((name: HTMLAnchorElement) => {
      // Only hook once
      if (name.dataset.hooked) return;
      name.dataset.hooked = "true";

      const id = paymentId(name);
      name.addEventListener("click", () => setPrinted(id, true));

      const input = document.createElement("input");
      input.type = "checkbox";
      // TODO: Subscribe to setPrinted changes (e.g. for auto on click)
      input.checked = hasBeenPrinted(id);
      setPrintedSubs[id] = (printed: boolean) => (input.checked = printed);
      input.onchange = () => setPrinted(id, input.checked);
      input.style.margin = "0.25em";
      // TODO: add "printed" label
      name.parentElement?.appendChild(input);
    });
  }

  let loop: number | null;
  function cancelPrint() {
    if (loop) clearInterval(loop);
  }
  function startPrintAll() {
    const urlPrefix = "https://www.paypal.com/shiplabel/packingslip/";
    const linkTags = select.paymentNames();
    const ids = linkTags.map(paymentId).filter((id) => !hasBeenPrinted(id));

    let i = 0;
    let win: Window | null;
    // FIXME: If the browser blocks opening popups this will loop infinitely
    // opening windows.
    // TODO: Replace with async (this interval stuff is GARBAGE!)
    loop = setInterval(() => {
      if (!win) {
        win = window.open(urlPrefix + ids[i]);
        setPrinted(ids[i], true);
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
