import { z } from 'zod';

export const gdprConsentSchema = z.object({
  firstName: z.string().min(2, "Meno musí mať aspoň 2 znaky.").max(50),
  lastName: z.string().min(2, "Priezvisko musí mať aspoň 2 znaky.").max(50),
  birthDate: z.string().min(1, "Dátum narodenia je povinný."),
  street: z.string().min(3, "Ulica a číslo sú povinné."),
  city: z.string().min(2, "Mesto je povinné."),
  zip: z.string().regex(/^\d{5}$/, "PSČ musí obsahovať presne 5 číslic bez medzier."),
  email: z.string().email("Neplatná e-mailová adresa."),
  phone: z.string().regex(/^\+?[0-9\s]+$/, "Neplatný formát telefónneho čísla.").min(9, "Telefónne číslo je príliš krátke."),
  primaryInterest: z.array(z.string()).min(1, "Zvoľte aspoň jednu službu."),
  marketingAccepted: z.boolean(),
  metaAccepted: z.boolean(),
  diagAccepted: z.boolean(),
});

export type GdprConsentFormData = z.infer<typeof gdprConsentSchema>;
