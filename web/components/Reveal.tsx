"use client";

import { useEffect } from "react";

export default function Reveal() {
  useEffect(function () {
    document.documentElement.classList.add("js");
    var els = document.querySelectorAll(".reveal");
    els.forEach(function (el, i) {
      el.style.setProperty("--reveal-delay", (i % 4) * 70 + "ms");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        e.target.classList.toggle("is-visible", e.isIntersecting);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
    return function () { io.disconnect(); };
  }, []);
  return null;
}
