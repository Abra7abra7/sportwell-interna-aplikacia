import { z } from 'zod';

export const gdprConsentSchema = z.object({
  firstName: z.string().min(2, "Meno musí mať aspoň 2 znaky.").max(50),
  lastName: z.string().min(2, "Priezvisko musí mať aspoň 2 znaky.").max(50),
  birthDate: z.string().min(1, "Dátum narodenia je povinný."),
  address: z.string().min(5, "Adresa je príliš krátka."),
  email: z.string().email("Neplatná e-mailová adresa."),
  phone: z.string().min(9, "Telefónne číslo je príliš krátke."),
  primaryInterest: z.string().min(1),
  marketingAccepted: z.boolean(),
  metaAccepted: z.boolean(),
  diagAccepted: z.boolean(),
});

export type GdprConsentFormData = z.infer<typeof gdprConsentSchema>;
