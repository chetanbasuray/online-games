"use client";

import { useEffect } from "react";

const WIDGET_SCRIPT_ID = "bmc-widget";

const WIDGET_ATTRIBUTES = {
  "data-name": "BMC-Widget",
  "data-cfasync": "false",
  src: "https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js",
  "data-id": "donatetochetan",
  "data-description": "Support me on Buy me a coffee!",
  "data-message":
    "I hope you enjoy these games. Please consider buying me a coffee, it helps keep the servers on :)",
  "data-color": "#BD5FFF",
  "data-position": "Right",
  "data-x_margin": "18",
  "data-y_margin": "18",
};

export default function SupportWidget() {
  useEffect(() => {
    let fallbackTimeout;

    const loadWidget = () => {
      if (document.getElementById(WIDGET_SCRIPT_ID)) return;

      const script = document.createElement("script");
      script.id = WIDGET_SCRIPT_ID;
      script.async = true;

      Object.entries(WIDGET_ATTRIBUTES).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });

      document.body.appendChild(script);
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadWidget, { timeout: 2000 });
    } else {
      fallbackTimeout = window.setTimeout(loadWidget, 1500);
    }

    return () => {
      if (fallbackTimeout) {
        window.clearTimeout(fallbackTimeout);
      }
    };
  }, []);

  return null;
}
