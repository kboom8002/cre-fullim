// src/components/mobile-im/ViewTracker.tsx

import React, { useEffect, useRef } from "react";

interface ViewTrackerProps {
  mobileImProjectId: string;
  currentSectionType: string;
}

export const ViewTracker: React.FC<ViewTrackerProps> = ({
  mobileImProjectId,
  currentSectionType
}) => {
  const dwellStartRef = useRef<number>(Date.now());
  const activeSectionRef = useRef<string>(currentSectionType);

  // Generate or get stable session ID
  const sessionIdRef = useRef<string>("");
  useEffect(() => {
    let sid = sessionStorage.getItem("mobile_im_session_id");
    if (!sid) {
      sid = "sess_" + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("mobile_im_session_id", sid);
    }
    sessionIdRef.current = sid;
  }, []);

  // Section dwell time logging
  useEffect(() => {
    const handleSectionChange = () => {
      const now = Date.now();
      const dwellSeconds = Math.round((now - dwellStartRef.current) / 1000);
      const prevSection = activeSectionRef.current;

      if (dwellSeconds > 0 && prevSection) {
        // Send previous section dwell time log
        const logData = {
          session_id: sessionIdRef.current,
          events: [
            {
              section_viewed: prevSection,
              dwell_time_seconds: dwellSeconds,
              device_type: window.innerWidth < 768 ? "mobile" : "desktop",
              event_type: "section_dwell",
              metadata: {
                viewport: `${window.innerWidth}x${window.innerHeight}`,
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };

        const url = `/api/mobile-im/${mobileImProjectId}/analytics`;
        const blob = new Blob([JSON.stringify(logData)], { type: "application/json" });

        // Use sendBeacon if available, otherwise fetch with keepalive
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, {
            method: "POST",
            body: JSON.stringify(logData),
            headers: { "Content-Type": "application/json" },
            keepalive: true,
          }).catch(() => {});
        }
      }

      // Reset timer for new active section
      dwellStartRef.current = now;
      activeSectionRef.current = currentSectionType;
    };

    // Trigger on change
    handleSectionChange();

    // Trigger on page hide / unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleSectionChange();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handleSectionChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handleSectionChange);
    };
  }, [currentSectionType, mobileImProjectId]);

  return null; // Pure functional tracking component, no UI
};
