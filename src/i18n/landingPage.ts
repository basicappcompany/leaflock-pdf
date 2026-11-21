import { landings, type LandingId } from '../tools/registry';
import { getMessages, type ToolMessagesBase } from './index';
import { landingsMore } from './en/landingsMore';

/**
 * The text of a landing page. English-only landings (`enOnly` in the registry) come from ./en/landingsMore.ts in every
 * language; the rest come from the locale's own catalogue.
 *
 * A module of its own on purpose: src/i18n/index.ts is imported by about seventy client components, and the English-only
 * text would land in every one of their chunks if this were exported from there. Only pages and scripts import this.
 */
export function landingPage(locale: string | undefined, id: LandingId): ToolMessagesBase {
  const more = landingsMore as Record<string, ToolMessagesBase>;
  const english = more[id];
  if (english) return english;
  return (getMessages(locale).landings as Record<string, ToolMessagesBase>)[id]!;
}

/** True for a landing whose text exists in English only. */
export function isEnglishOnly(id: LandingId): boolean {
  const entry = landings.find((item) => item.id === id);
  return !!entry && 'enOnly' in entry && entry.enOnly === true;
}
