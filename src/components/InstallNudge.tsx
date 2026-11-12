"use client";

import { useState } from "react";
import InstallGuide from "./InstallGuide";
import { readFlag, useClientValue, writeFlag } from "@/lib/useClient";

const KEY = "monti-install-nudge-hidden";

/** Install steps inside the app for people who signed in from the browser; hidden once dismissed or installed. */
export default function InstallNudge() {
  const stored = useClientValue(() => readFlag(KEY), true);
  const [dismissed, setDismissed] = useState(false);
  if (stored || dismissed) return null;
  return <InstallGuide onSkip={() => { setDismissed(true); writeFlag(KEY); }} />;
}
