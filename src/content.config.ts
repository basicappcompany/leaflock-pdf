import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { tools } from './tools/registry';

const toolId = z.enum(tools.map((tool) => tool.id) as [string, ...string[]]);

/**
 * Long-form content lives in Markdown, one folder per language: src/content/<collection>/<locale>/<slug>.md.
 * An entry's id is "<locale>/<slug>"; translations share the slug.
 */

/** How-to articles and explainers. */
const guides = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    /** Meta description: 120–160 characters, written for the search result. */
    description: z.string(),
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
    /** Tools this guide is about; it's linked from their pages. */
    tools: z.array(toolId).default([]),
  }),
});

/** Company, trust and legal pages. */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    updated: z.coerce.date(),
    /** Legal text not yet reviewed by a lawyer; shows a notice on the page. */
    awaitingLegalReview: z.boolean().default(false),
  }),
});

/** Factual comparisons with other PDF services. */
const compare = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/compare' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    competitor: z.string(),
    /** When every claim about the competitor was last checked against the sources. */
    checkedOn: z.coerce.date(),
    /** The competitor's own pages that back up each claim. */
    sources: z.array(z.object({ label: z.string(), url: z.url() })).min(1),
  }),
});

export const collections = { guides, pages, compare };
