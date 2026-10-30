import { describe, expect, it } from 'vitest';
import { parseCsv, writeCsv } from '../../src/lib/convert/csv';

describe('parseCsv', () => {
  it('splits simple rows and columns', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps a comma inside a quoted field', () => {
    expect(parseCsv('"Smith, John",42')).toEqual([['Smith, John', '42']]);
  });

  it('keeps a line break inside a quoted field, rather than splitting the row early', () => {
    // The tempting shortcut — split the text into lines first — gets this one wrong.
    expect(parseCsv('"multi\nline",ok\nnext,row')).toEqual([
      ['multi\nline', 'ok'],
      ['next', 'row'],
    ]);
  });

  it('unescapes a doubled quote inside a quoted field', () => {
    expect(parseCsv('"She said ""hi""",fine')).toEqual([['She said "hi"', 'fine']]);
  });

  it('keeps empty fields, including a trailing one', () => {
    expect(parseCsv('a,,c\n,,')).toEqual([
      ['a', '', 'c'],
      ['', '', ''],
    ]);
  });

  it('tolerates rows of different lengths', () => {
    expect(parseCsv('a,b,c\n1,2')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2'],
    ]);
  });

  it('does not invent a phantom row from a file ending in a newline', () => {
    expect(parseCsv('a,b\n')).toEqual([['a', 'b']]);
  });

  it('produces nothing for an empty file', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('reads a single value with no delimiter at all', () => {
    expect(parseCsv('just one cell')).toEqual([['just one cell']]);
  });

  it('allows a quoted field to end exactly at a row boundary', () => {
    expect(parseCsv('"last field"\nnext,row')).toEqual([['last field'], ['next', 'row']]);
  });
});

describe('writeCsv', () => {
  it('joins plain fields with commas and rows with CRLF', () => {
    expect(writeCsv([['a', 'b', 'c'], ['1', '2', '3']])).toBe('a,b,c\r\n1,2,3');
  });

  it('quotes a field containing a comma, a quote, or a line break, doubling embedded quotes', () => {
    expect(writeCsv([['Smith, John', 'Says "hi"', 'Multi\nline']])).toBe(
      '"Smith, John","Says ""hi""","Multi\nline"',
    );
  });

  it('round-trips through parseCsv unchanged', () => {
    const rows = [['a', 'b, c', 'd"e'], ['', 'f\ng', 'h']];
    expect(parseCsv(writeCsv(rows))).toEqual(rows);
  });
});
