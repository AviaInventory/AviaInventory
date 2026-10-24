import { permanentRedirect } from "next/navigation";

/** Friendly URL for the MRO Services tab, which lives at /suppliers. */
export default function MROServicesAlias() {
  permanentRedirect("/suppliers");
}
