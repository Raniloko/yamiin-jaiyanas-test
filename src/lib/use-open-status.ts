import { useEffect, useState } from "react";

import { openStatus } from "@/lib/pickup-slots";

/** Öffnungsstatus, jede Minute neu – erst im Browser berechnet, damit Server und Gerät dieselbe Uhrzeit nutzen. */
export function useOpenStatus() {
  const [status, setStatus] = useState<ReturnType<typeof openStatus> | null>(null);
  // Erst im Browser berechnet, damit Server und Gerät dieselbe Uhrzeit nutzen.
  useEffect(() => {
    const update = () => setStatus(openStatus(new Date()));
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  return status;
}
