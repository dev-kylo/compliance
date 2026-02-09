import type { FunderProfile } from "@compliance/shared-types";
import { UKRI_PROFILE } from "./ukri";

const FUNDER_PROFILES: Record<string, FunderProfile> = {
  ukri: UKRI_PROFILE,
};

export function getFunderProfile(id: string): FunderProfile | undefined {
  return FUNDER_PROFILES[id];
}

export function getAllFunderProfiles(): FunderProfile[] {
  return Object.values(FUNDER_PROFILES);
}

export { UKRI_PROFILE };
