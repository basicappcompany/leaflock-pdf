import type { DocMetadata } from '../metadata';

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * The XMP packet PDF/A requires: the `pdfaid` identification every validator checks
 * first, plus the Dublin Core / XMP basic fields mirroring the Info dictionary so the
 * two don't disagree (see `removeMetadata.ts`'s note on exactly that kind of mismatch).
 */
export function buildPdfaXmpPacket(meta: DocMetadata, part: 2, conformance: 'B'): string {
  const fields = [
    `<pdfaid:part>${part}</pdfaid:part>`,
    `<pdfaid:conformance>${conformance}</pdfaid:conformance>`,
    meta.title && `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(meta.title)}</rdf:li></rdf:Alt></dc:title>`,
    meta.author && `<dc:creator><rdf:Seq><rdf:li>${escapeXml(meta.author)}</rdf:li></rdf:Seq></dc:creator>`,
    meta.subject && `<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${escapeXml(meta.subject)}</rdf:li></rdf:Alt></dc:description>`,
    meta.keywords && `<pdf:Keywords>${escapeXml(meta.keywords)}</pdf:Keywords>`,
    '<pdf:Producer>LeafLock PDF</pdf:Producer>',
    '<xmp:CreatorTool>LeafLock PDF</xmp:CreatorTool>',
  ]
    .filter(Boolean)
    .join('\n      ');

  return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
      xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:pdf="http://ns.adobe.com/pdf/1.3/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/">
      ${fields}
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
