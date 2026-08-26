export interface Range {
  top: number;
  bottom: number;
}

/**
 * Given a list of "atom" ranges (in document order, contiguous, measured in the same unit as
 * `pageHeight`) that together make up ONE block of content, returns the list of page slices
 * needed to render it — packing as many whole atoms as fit on each page, and only ever cutting
 * through the middle of a single atom when that one atom is, by itself, taller than a full page
 * (an unavoidable last resort, e.g. an extremely long transcript line).
 *
 * This is what makes the exported PDF avoid both symptoms of the old fixed-height slicing:
 * blank gaps at the bottom of a page (we pack right up to the page limit) and content chopped
 * mid-paragraph (we only ever cut at a real boundary between atoms, except in that one
 * unavoidable oversized-atom case).
 */
export function computeBlockPageSlices(atoms: Range[], pageHeight: number): Range[] {
  if (atoms.length === 0) return [];
  if (pageHeight <= 0) {
    throw new Error('pageHeight debe ser mayor que 0');
  }

  const blockEnd = atoms[atoms.length - 1].bottom;
  const boundaries = atoms.map((a) => a.bottom);
  const slices: Range[] = [];
  let pageStart = atoms[0].top;

  while (pageStart < blockEnd) {
    const idealCut = pageStart + pageHeight;

    // The best (largest) safe boundary that still fits within this page.
    let cut = -Infinity;
    for (const boundary of boundaries) {
      if (boundary > pageStart && boundary <= idealCut) {
        cut = Math.max(cut, boundary);
      }
    }

    if (cut === -Infinity) {
      // No atom boundary fits on this page at all — forced to cut mid-atom as a last resort.
      cut = Math.min(idealCut, blockEnd);
    }

    slices.push({ top: pageStart, bottom: cut });
    pageStart = cut;
  }

  return slices;
}
