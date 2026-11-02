import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  NoteItem,
  formatPdfFilename,
  buildPrintableNoteHtml,
} from './notesLogic';

/**
 * Exports a NoteItem to a multi-page A4 PDF file with full Unicode/Vietnamese support
 * and editorial Markdown formatting. Returns the generated PDF filename.
 */
export async function exportNoteToPdf(
  note: NoteItem,
  filterLabel: string
): Promise<string> {
  const filename = formatPdfFilename(note.title);

  // Create offscreen light-mode editorial container for high-DPI canvas capture
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px';
  wrapper.style.background = '#ffffff';
  wrapper.style.color = '#1a1a1a';
  wrapper.style.zIndex = '-1';
  wrapper.innerHTML = buildPrintableNoteHtml(note, filterLabel);

  document.body.appendChild(wrapper);

  try {
    const targetEl = (wrapper.firstElementChild as HTMLElement) || wrapper;
    const canvas = await html2canvas(targetEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidthMm = pdf.internal.pageSize.getWidth(); // 210mm
    const pageHeightMm = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidthMm = pageWidthMm;
    const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

    let heightLeftMm = imgHeightMm;
    let positionMm = 0;

    pdf.addImage(imgData, 'PNG', 0, positionMm, imgWidthMm, imgHeightMm);
    heightLeftMm -= pageHeightMm;

    while (heightLeftMm > 2) {
      positionMm = heightLeftMm - imgHeightMm;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, positionMm, imgWidthMm, imgHeightMm);
      heightLeftMm -= pageHeightMm;
    }

    pdf.save(filename);
    return filename;
  } catch (err) {
    console.warn('Falling back to text PDF generation:', err);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    pdf.setFontSize(18);
    pdf.text(note.title || 'Untitled Note', 15, 20);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(note.content || '', 180);
    pdf.text(lines, 15, 32);
    pdf.save(filename);
    return filename;
  } finally {
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
}
