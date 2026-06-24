const pdfmake = require('pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts');

// Mapovanie virtuálnych fontov
if (pdfmake.virtualfs && pdfmake.virtualfs.storage) {
  for (const key in vfsFonts) {
    if (Object.prototype.hasOwnProperty.call(vfsFonts, key)) {
      pdfmake.virtualfs.storage[key] = Buffer.from(vfsFonts[key], 'base64');
    }
  }
}

export interface PdfClientProfile {
  full_name: string;
  phone?: string;
  email?: string;
  address?: string; // Formatted address
  metadata?: {
    birthDate?: string;
    birth_date?: string;
  };
}

export interface UnifiedPdfOptions {
  documentTitle: string;
  documentDateLabel: string;
  documentDateValue: string;
  clientProfile?: PdfClientProfile;
  contentBlocks: any[];
}

export async function generateUnifiedPdf(options: UnifiedPdfOptions): Promise<Buffer> {
  const fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  };

  pdfmake.setFonts(fonts);

  const { documentTitle, documentDateLabel, documentDateValue, clientProfile, contentBlocks } = options;

  let patientDetailsBlock: any = [];

  if (clientProfile) {
    const birthDateStr = clientProfile.metadata?.birthDate || clientProfile.metadata?.birth_date;
    
    patientDetailsBlock = [
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                stack: [
                  { text: 'Údaje o pacientovi', fontSize: 14, bold: true, color: '#020C1B', margin: [0, 0, 0, 10] },
                  {
                    columns: [
                      {
                        stack: [
                          { text: `Meno a priezvisko: ${clientProfile.full_name}`, fontSize: 10, margin: [0, 2, 0, 2] },
                          { text: `E-mail: ${clientProfile.email || "Nezadané"}`, fontSize: 10, margin: [0, 2, 0, 2] },
                          { text: `Trvalý pobyt: ${clientProfile.address || "Nezadané"}`, fontSize: 10, margin: [0, 2, 0, 2] }
                        ]
                      },
                      {
                        stack: [
                          { text: `Telefón: ${clientProfile.phone || "Nezadané"}`, fontSize: 10, margin: [0, 2, 0, 2] },
                          { text: `Dátum nar.: ${birthDateStr ? new Date(birthDateStr).toLocaleDateString('sk-SK') : "Nezadané"}`, fontSize: 10, margin: [0, 2, 0, 2] }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#e2e8f0',
          vLineColor: () => '#e2e8f0',
          paddingLeft: () => 15,
          paddingRight: () => 15,
          paddingTop: () => 12,
          paddingBottom: () => 12,
        },
        fillColor: '#F7FAFC',
        margin: [0, 0, 0, 25]
      }
    ];
  }

  const docDefinition: any = {
    content: [
      // Zjednotená tmavá hlavička
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                stack: [
                  { text: 'SportWell', fontSize: 22, bold: true, color: '#ffffff' },
                  { text: 'ŠPORTOVO-REHABILITAČNÉ CENTRUM', fontSize: 9, color: '#00F0FF', margin: [0, 2, 0, 5] },
                  { text: 'Černyševského 30, 851 01 Bratislava', fontSize: 8, color: '#D3FAFF', opacity: 0.8 },
                  { text: 'IČO: 52 124 118', fontSize: 8, color: '#D3FAFF', opacity: 0.8 }
                ]
              },
              {
                stack: [
                  { text: documentTitle, fontSize: 18, bold: true, color: '#00F0FF', alignment: 'right' },
                  { text: `${documentDateLabel}: ${documentDateValue}`, fontSize: 10, color: '#ffffff', alignment: 'right', margin: [0, 10, 0, 0] }
                ]
              }
            ]
          ]
        },
        layout: 'noBorders',
        fillColor: '#0A192F',
        margin: [-40, -40, -40, 20],
        padding: [40, 30, 40, 30]
      },

      ...patientDetailsBlock,

      // Vlastný obsah špecifický pre daný dokument
      ...contentBlocks,

      // Zjednotená pätička
      {
        stack: [
          { text: `Vygenerované a elektronicky zašifrované systémom SportWell • ${new Date().toLocaleString('sk-SK')}`, fontSize: 9, color: '#94a3b8', alignment: 'center' },
          { text: 'Tento dokument obsahuje dôverné osobné, lekárske alebo fyzioterapeutické údaje.', fontSize: 8, color: '#cbd5e1', alignment: 'center', margin: [0, 4, 0, 0] }
        ],
        margin: [0, 30, 0, 0],
        pageBreak: 'avoid'
      }
    ],
    defaultStyle: {
      font: 'Roboto'
    }
  };

  const pdfDoc = pdfmake.createPdf(docDefinition);
  const buffer = await pdfDoc.getBuffer();
  return buffer;
}
