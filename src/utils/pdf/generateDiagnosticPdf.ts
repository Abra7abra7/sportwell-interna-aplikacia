import { generateUnifiedPdf, PdfClientProfile } from './PdfBuilder';

export async function generateDiagnosticPdf(
  templateTitle: string,
  clientProfile: PdfClientProfile,
  createdAt: string,
  fields: { label: string; value: any }[]
): Promise<Buffer> {
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

  const contentBlocks = [
    { text: 'Výsledky diagnostiky', fontSize: 14, bold: true, color: '#020C1B', margin: [0, 10, 0, 15] },
    { stack: formattedFields }
  ];

  return generateUnifiedPdf({
    documentTitle: templateTitle,
    documentDateLabel: 'Dátum vyšetrenia',
    documentDateValue: new Date(createdAt).toLocaleDateString('sk-SK'),
    clientProfile,
    contentBlocks
  });
}
