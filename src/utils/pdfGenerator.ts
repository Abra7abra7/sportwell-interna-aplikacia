import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// @ts-ignore
import pdfMake from "pdfmake/build/pdfmake";
// @ts-ignore
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const generatePdfFromElement = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  const opt = {
    margin: 15,
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
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
      logging: false,
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    
    // A4 width is 595.28 pts. Margin is 15.
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [15, 15, 15, 15],
      content: [
        {
          image: imgData,
          width: 595.28 - 30,
        }
      ]
    };
    
    if (password) {
      docDefinition.userPassword = password;
      docDefinition.ownerPassword = password + "_admin";
      docDefinition.permissions = {
        printing: 'highResolution',
        modifying: false,
        copying: false,
      };
    }

    return new Promise((resolve) => {
      pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
        resolve(blob);
      });
    });
  } catch (error) {
    console.error("Chyba pri generovaní PDF:", error);
    return null;
  }
};
