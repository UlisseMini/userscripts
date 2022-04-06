"use strict";
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
    // Helpers
    const $$ = (x) => Array.from(document.querySelectorAll(x));
    const $ = (x) => document.querySelector(x);
    const set = (k, v) => localStorage.setItem("uli-" + k, JSON.stringify(v));
    const get = (k) => JSON.parse(localStorage.getItem("uli-" + k) || "null");
    function untilSuccess(fn) {
        const id = setInterval(() => {
            if (fn())
                clearInterval(id);
        }, 200);
    }
    const setClicked = (id) => {
        const clicked = get("clicked") || [];
        !clicked.includes(id) && clicked.push(id);
        set("clicked", clicked);
    };
    const hasBeenClicked = (id) => (get("clicked") || []).includes(id);
    const getId = (a) => a.href.match(/\w+$/)[0];
    const createButton = (text, onclick) => {
        const button = document.createElement("button");
        button.textContent = text;
        button.onclick = onclick;
        return button;
    };
    const addButton = (text, onclick) => {
        const button = createButton(text, onclick);
        return Boolean($(".SearchFilterContainer")?.firstChild?.childNodes[1].appendChild(button));
    };
    const select = {
        paymentNames: () => $$(`td a[href^="/activity/payment/"]`),
    };
    let hooked = {};
    function hookAll() {
        // Select names
        // TODO: Add class, use :not instead of hooked dict (or use onclick)
        const names = select.paymentNames();
        names.forEach((name) => {
            // Color based on hasBeenClicked
            const id = getId(name);
            const color = hasBeenClicked(id) ? "red" : "green";
            name.style.border = "1px solid " + color;
            // Only hook listener once
            if (hooked[name.href])
                return;
            hooked[name.href] = true;
            name.addEventListener("click", () => setClicked(id));
        });
    }
    let loop;
    function cancelPrint() {
        if (loop)
            clearInterval(loop);
    }
    function printAll() {
        const urlPrefix = "https://www.paypal.com/shiplabel/packingslip/";
        const linkTags = select.paymentNames();
        const ids = linkTags.map(getId).filter((id) => !hasBeenClicked(id));
        let i = 0;
        let win;
        loop = setInterval(() => {
            if (!win) {
                win = window.open(urlPrefix + ids[i]);
                setClicked(ids[i]);
            }
            else if (win.closed) {
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
        setInterval(hookAll, 1000);
        untilSuccess(() => addButton("Print all slips", printAll));
        untilSuccess(() => addButton("Cancel print all", cancelPrint));
    }
    else if (url.match(/.*\/shiplabel\/packingslip\/.*/)) {
        // Now we're on /shiplabel/packingslip/<id>, so print
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
