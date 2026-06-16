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
  if (!element) {
    console.error(`Element ${elementId} neexistuje!`);
    return null;
  }

  try {
    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number], // margin in mm
      filename: 'document.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    
    // Pouzijeme html2pdf workers api pre ziskanie jsPDF instancie
    const worker = html2pdf().set(opt).from(element);
    
    // Ziskame jsPDF instanciu a vlozime heslo ak treba
    const pdf = await worker.toPdf().get('pdf');
    
    if (password) {
      console.log("Pokus o aplikovanie hesla do jsPDF...");
      try {
        if (typeof (pdf as any).setEncryption === 'function') {
          (pdf as any).setEncryption({
            userPassword: password,
            ownerPassword: password + "_admin",
            userPermissions: ["print"]
          });
        }
      } catch (e) {
        console.warn("Šifrovanie zlyhalo, sťahujem nezašifrované PDF.", e);
      }
    }

    console.log("Vytvaram output Blob z html2pdf...");
    const blob = await pdf.output('blob');
    console.log("PDF vygenerovane uspesne!");
    return blob;
    
  } catch (error) {
    console.error("Chyba pri generovaní PDF:", error);
    alert("Chyba pri generovaní PDF: " + String(error));
    return null;
  }
};
