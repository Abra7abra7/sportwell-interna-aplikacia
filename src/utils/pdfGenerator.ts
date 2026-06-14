import { jsPDF } from 'jspdf';

interface ClientProfileForPdf {
  full_name: string;
  email?: string;
  phone: string;
  gdpr_signed_at: string | null;
  metadata?: {
    gdpr_version?: string;
    [key: string]: any;
  };
}

/**
 * Generates a jsPDF instance for GDPR consent confirmation.
 * @param profile ClientProfile object
 */
export function generateGdprPdf(profile: ClientProfileForPdf): jsPDF {
  const signedDate = profile.gdpr_signed_at
    ? new Date(profile.gdpr_signed_at).toLocaleString('sk-SK')
    : new Date().toLocaleString('sk-SK');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(10, 25, 47); // brand-navy
  doc.rect(0, 0, W, 42, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 240, 255); // brand-cyan
  doc.text('SportWell', 15, 18);

  doc.setFontSize(9);
  doc.setTextColor(180, 210, 220);
  doc.text('zdravie na prvom mieste', 15, 25);

  // Title
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('GDPR SÚHLAS & REGISTRÁCIA', W / 2, 35, { align: 'center' });

  // Cyan accent line
  doc.setDrawColor(0, 240, 255);
  doc.setLineWidth(0.8);
  doc.line(0, 42, W, 42);

  let y = 55;

  // Section: Identifikácia
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(12, y - 5, W - 24, 38, 2, 2, 'F');
  doc.setDrawColor(200, 220, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, y - 5, W - 24, 38, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 25, 47);
  doc.text('IDENTIFIKÁCIA DOTKNUTEJ OSOBY', 17, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 80, 100);
  
  const rows = [
    ['Meno a priezvisko', profile.full_name || '—'],
    ['E-mail', profile.email || '—'],
    ['Telefón', profile.phone || '—'],
  ];
  rows.forEach(([label, value], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 100, 120);
    doc.text(label + ':', 17, y + 12 + i * 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(10, 25, 47);
    doc.text(value, 70, y + 12 + i * 8);
  });

  y += 48;

  // Section: Súhlasy
  doc.setFillColor(240, 255, 248);
  doc.roundedRect(12, y - 5, W - 24, 46, 2, 2, 'F');
  doc.setDrawColor(180, 230, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, y - 5, W - 24, 46, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 25, 47);
  doc.text('UDELENÉ SÚHLASY', 17, y + 2);

  doc.setFontSize(9);
  const consents = [
    '✓  Súhlas so spracovaním citlivých zdravotných údajov',
    '    (Fyzioterapia, Rehabilitácia, Tréning)',
    '✓  Súhlas s Podmienkami a VOP rezervačného systému',
    '    (vrátane storno podmienok 24 hodín)',
  ];
  consents.forEach((line, i) => {
    const isCheck = line.startsWith('✓');
    doc.setFont('helvetica', isCheck ? 'bold' : 'normal');
    doc.setTextColor(isCheck ? 20 : 80, isCheck ? 120 : 100, isCheck ? 60 : 110);
    doc.text(line, 17, y + 12 + i * 7);
  });

  y += 56;

  // Section: Podpis & Overenie
  doc.setFillColor(245, 245, 255);
  doc.roundedRect(12, y - 5, W - 24, 40, 2, 2, 'F');
  doc.setDrawColor(200, 200, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, y - 5, W - 24, 40, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(10, 25, 47);
  doc.text('PODPIS & OVERENIE', 17, y + 2);

  doc.setFontSize(9);
  [
    ['Dátum podpísania', signedDate],
    ['Verzia dokumentu', profile.metadata?.gdpr_version || 'v3.0'],
    ['Metóda podpisu', 'Elektronický súhlas (e-podpis)'],
    ['Prevádzkovatelia', 'SportWell s.r.o. & SportWell rehab s.r.o.'],
  ].forEach(([label, value], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(80, 80, 120);
    doc.text(label + ':', 17, y + 12 + i * 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(10, 25, 47);
    doc.text(value, 72, y + 12 + i * 7);
  });

  y += 50;

  // Legal notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 130, 145);
  const legal = 'Tento dokument je platným potvrdením o udelení GDPR súhlasu v súlade so zákonom č. 18/2018 Z.z.';
  const legal2 = 'o ochrane osobných údajov a nariadením GDPR (EÚ) 2016/679.';
  doc.text(legal, W / 2, y, { align: 'center' });
  doc.text(legal2, W / 2, y + 5, { align: 'center' });

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFillColor(10, 25, 47);
  doc.rect(0, pageH - 16, W, 16, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(0, 240, 255);
  doc.text('SportWell  |  zdravie na prvom mieste  |  www.sportwell.sk', W / 2, pageH - 6, { align: 'center' });

  return doc;
}
