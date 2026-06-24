import { GdprConsentFormData } from '@/components/gdpr/schema';
import { generateUnifiedPdf } from './PdfBuilder';

export async function generateGdprPdf(data: GdprConsentFormData): Promise<Buffer> {
  const contentBlocks = [
    {
      text: `Hlavná oblasť záujmu: ${Array.isArray(data.primaryInterest) ? data.primaryInterest.join(', ') : data.primaryInterest}`,
      fontSize: 10,
      margin: [0, 0, 0, 5]
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
  ];

  return generateUnifiedPdf({
    documentTitle: 'SÚHLAS SO SPRACOVANÍM OSOBNÝCH ÚDAJOV',
    documentDateLabel: 'Dátum a čas podpisu',
    documentDateValue: new Date().toLocaleString('sk-SK'),
    clientProfile: {
      full_name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone,
      address: `${data.street}, ${data.zip} ${data.city}`,
      metadata: {
        birthDate: data.birthDate
      }
    },
    contentBlocks
  });
}
