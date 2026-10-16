"use client";

import { useEffect } from "react";

/**
 * Scrolls to the element named in the URL hash (e.g. a notification link to
 * "/supplier/rfqs/<id>#submit-quote"). Pages that load their content after
 * navigation don't have the target yet, so this keeps looking for a few seconds.
 */
export default function ScrollToHash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let tries = 0;
    const timer = window.setInterval(() => {
      const target = document.getElementById(id);
      tries += 1;
      if (target) {
        window.clearInterval(timer);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (tries > 40) {
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
