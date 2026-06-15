import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export const generatePdfFromElement = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  const opt = {
    margin: [15, 15, 15, 15],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};

export const generatePdfBlob = async (elementId: string, password?: string): Promise<Blob | null> => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    let finalBlob = pdf.output('blob');

    if (password) {
      try {
        const { PDFDocument } = await import('pdf-lib');
        const pdfBytes = await finalBlob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        
        pdfDoc.encrypt({
          userPassword: password,
          ownerPassword: password + "_admin",
          permissions: {
            printing: 'highResolution',
            modifying: false,
            copying: false,
          },
        });
        
        const encryptedBytes = await pdfDoc.save();
        finalBlob = new Blob([encryptedBytes], { type: 'application/pdf' });
      } catch (encryptErr) {
        console.error("Chyba pri šifrovaní s pdf-lib:", encryptErr);
      }
    }
    
    return finalBlob;
  } catch (err) {
    console.error("Chyba pri generovaní PDF s heslom:", err);
    return null;
  }
};
