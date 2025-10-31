"use client";

import Script from "next/script";

export default function SupportWidget() {
  return (
    <Script
      id="bmc-widget"
      data-name="BMC-Widget"
      data-cfasync="false"
      src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js"
      data-id="donatetochetan"
      data-description="Support me on Buy me a coffee!"
      data-message="I hope you enjoy these games. Please consider buying me a coffee, it helps keep the servers on :)"
      data-color="#BD5FFF"
      data-position="Right"
      data-x_margin="18"
      data-y_margin="18"
      strategy="afterInteractive"
    />
  );
}
