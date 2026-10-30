import type { ToolId } from '../tools/registry';
import { en } from './en';

export { format, plural, type PluralForms } from './format';
export type { CommonMessages } from './en/common';
export type { ToolMessagesBase } from './en';

export type Messages = typeof en;
export type ToolMessages<K extends ToolId> = Messages['tools'][K];

export const locales = { en } satisfies Record<string, Messages>;

export type Locale = keyof typeof locales;

export const defaultLocale: Locale = 'en';

export function getMessages(locale: string | undefined): Messages {
  return locales[(locale ?? defaultLocale) as Locale] ?? locales[defaultLocale];
}
