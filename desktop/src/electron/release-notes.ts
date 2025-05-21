export function format(notes: string | { note: string }[] | undefined): string {
  if (typeof notes === 'string') return notes;
  if (Array.isArray(notes)) return notes.map((n) => n.note).join('\n\n');
  return '';
}
