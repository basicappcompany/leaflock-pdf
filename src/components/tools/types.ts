import type { CommonMessages, ToolMessages } from '../../i18n';
import type { ToolId } from '../../tools/registry';

/** Props every tool component receives from ToolApp. */
export interface ToolProps<K extends ToolId> {
  locale: string;
  common: CommonMessages;
  t: ToolMessages<K>;
  /** Options chosen in advance by a landing page, e.g. { format: 'png' }. */
  preset?: Readonly<Record<string, string>> | undefined;
}
