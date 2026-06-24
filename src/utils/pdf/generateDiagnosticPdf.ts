import PdfPrinter from 'pdfmake';

interface PdfClientProfile {
  full_name: string;
  phone?: string;
  email?: string;
  metadata?: {
    birthDate?: string;
  };
}

export async function generateDiagnosticPdf(
  templateTitle: string,
  clientProfile: PdfClientProfile,
  createdAt: string,
  fields: { label: string; value: any }[]
): Promise<Buffer> {
  const fonts = {
    Roboto: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique'
    }
  };

  const printer = new (PdfPrinter as any)(fonts);

  const formattedFields = fields.map(f => {
    let displayVal = "Nezadané";
    if (f.value !== undefined && f.value !== null) {
      if (Array.isArray(f.value)) {
        displayVal = f.value.join(", ");
      } else if (typeof f.value === 'object' && f.value !== null && f.value.fileName) {
        displayVal = `Priložený súbor: ${f.value.fileName}`;
      } else if (typeof f.value === 'object' && f.value !== null) {
        displayVal = Object.entries(f.value).map(([k, v]) => `${k}: ${String(v)}`).join(", ");
      } else {
        displayVal = String(f.value);
      }
    }

    return [
      { text: f.label, bold: true, fontSize: 10, color: '#00F0FF', margin: [0, 10, 0, 4] },
      { text: displayVal, fontSize: 11, color: '#0A192F', margin: [0, 0, 0, 10] }
    ];
  }).flat();

  const docDefinition: any = {
    content: [
      // Header Section (mimics dark header)
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
                  { text: templateTitle, fontSize: 18, bold: true, color: '#00F0FF', alignment: 'right' },
                  { text: `Dátum vyšetrenia: ${new Date(createdAt).toLocaleDateString('sk-SK')}`, fontSize: 10, color: '#ffffff', alignment: 'right', margin: [0, 10, 0, 0] }
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

      // Patient Details
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
                          { text: `Meno: ${clientProfile.full_name}`, fontSize: 10, margin: [0, 2, 0, 2] },
                          { text: `E-mail: ${clientProfile.email || "Nezadané"}`, fontSize: 10, margin: [0, 2, 0, 2] }
                        ]
                      },
                      {
                        stack: [
                          { text: `Telefón: ${clientProfile.phone || "Nezadané"}`, fontSize: 10, margin: [0, 2, 0, 2] },
                          { text: `Dátum nar.: ${clientProfile.metadata?.birthDate ? new Date(clientProfile.metadata.birthDate).toLocaleDateString('sk-SK') : "Nezadané"}`, fontSize: 10, margin: [0, 2, 0, 2] }
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
      },

      // Diagnostic Results Title
      { text: 'Výsledky diagnostiky', fontSize: 14, bold: true, color: '#020C1B', margin: [0, 10, 0, 15] },

      // Fields list
      {
        stack: formattedFields
      },

      // Footer
      {
        stack: [
          { text: `Vygenerované a elektronicky zašifrované systémom SportWell • ${new Date().toLocaleString('sk-SK')}`, fontSize: 9, color: '#94a3b8', alignment: 'center' },
          { text: 'Tento dokument obsahuje prísne dôverné lekárske a fyzioterapeutické údaje.', fontSize: 8, color: '#cbd5e1', alignment: 'center', margin: [0, 4, 0, 0] }
        ],
        margin: [0, 30, 0, 0],
        pageBreak: 'avoid'
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
