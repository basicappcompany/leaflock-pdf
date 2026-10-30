/** Fills `{name}`-style placeholders. Unknown placeholders are left as they are. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** Plural forms for one string. Only `other` is required; languages add the categories they use. */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Picks the right plural form for `count` in `locale` and fills `{count}`. */
export function plural(locale: string, forms: PluralForms, count: number): string {
  const category = new Intl.PluralRules(locale).select(count);
  return format(forms[category] ?? forms.other, { count: count.toLocaleString(locale) });
}
