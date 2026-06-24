import PdfPrinter from 'pdfmake';
import { GdprConsentFormData } from '@/components/gdpr/schema';

export async function generateGdprPdf(data: GdprConsentFormData): Promise<Buffer> {
  const fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };

  const printer = new (PdfPrinter as any)(fonts);

  const docDefinition: any = {
    content: [
      { text: 'SportWell', fontSize: 24, bold: true, color: '#0A192F', margin: [0, 0, 0, 5] },
      { text: 'ŠPORTOVO-REHABILITAČNÉ CENTRUM', fontSize: 10, color: '#00F0FF', margin: [0, 0, 0, 20] },
      { text: 'SÚHLAS SO SPRACOVANÍM OSOBNÝCH ÚDAJOV (GDPR)', fontSize: 16, bold: true, color: '#020C1B', margin: [0, 0, 0, 15] },
      { text: `Dátum podpisu: ${new Date().toLocaleDateString('sk-SK')}`, fontSize: 10, margin: [0, 0, 0, 20] },
      
      {
        table: {
          widths: ['*', '*'],
          body: [
            [{ text: 'Meno a priezvisko:', bold: true }, `${data.firstName} ${data.lastName}`],
            [{ text: 'Dátum narodenia:', bold: true }, data.birthDate ? new Date(data.birthDate).toLocaleDateString('sk-SK') : ''],
            [{ text: 'Trvalý pobyt (Adresa):', bold: true }, data.address],
            [{ text: 'E-mail:', bold: true }, data.email],
            [{ text: 'Telefón:', bold: true }, data.phone],
            [{ text: 'Primárny záujem:', bold: true }, data.primaryInterest]
          ]
        },
        margin: [0, 0, 0, 20]
      },

      { text: 'Udelené súhlasy a vyhlásenia:', fontSize: 14, bold: true, color: '#020C1B', margin: [0, 10, 0, 10] },

      {
        ul: [
          'Oboznámenie sa s pravidlami ochrany osobných údajov a dohody podľa čl. 26 GDPR: ÁNO (Povinné)',
          'Súhlas s podmienkami používania rezervačného systému: ÁNO (Povinné)',
          `Súhlas so spracovaním e-mailovej adresy na marketingové účely: ${data.marketingAccepted ? 'ÁNO' : 'NIE'}`,
          `Súhlas s poskytnutím e-mailovej adresy tretej osobe (Meta Platforms): ${data.metaAccepted ? 'ÁNO' : 'NIE'}`,
          `Súhlas so spracovaním údajov získaných počas vstupnej diagnostiky: ${data.diagAccepted ? 'ÁNO' : 'NIE'}`
        ],
        fontSize: 11,
        margin: [0, 0, 0, 20]
      },

      { text: 'Vyhlásenie klienta:', fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
      {
        text: 'Tento dokument bol vygenerovaný na základe elektronického súhlasu udeleného používateľom po úspešnom overení e-mailovej adresy jednorazovým kódom. IP adresa a časová pečiatka sú bezpečne uložené v databáze systému SportWell.',
        fontSize: 10,
        italics: true,
        color: '#666666'
      }
    ],
    defaultStyle: {
      font: 'Roboto'
    }
  };

  const pdfDoc = printer.createPdfKitDocument(docDefinition);
  const chunks: any[] = [];

  return new Promise<Buffer>((resolve, reject) => {
    pdfDoc.on('data', (chunk: any) => chunks.push(chunk));
    pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfDoc.on('error', (err: any) => reject(err));
    pdfDoc.end();
  });
}
