import { z } from "zod";

// --- FORMÁTOVACIE FUNKCIE ---

export const formatPhone = (phone: string): string => {
  if (!phone) return "";
  
  // Odstránime všetko okrem čísel a znaku +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ak začína na 0 (napr. 0900), predpokladáme Slovensko a nahradíme 0 za +421
  if (cleaned.startsWith('09') || cleaned.startsWith('02')) {
    cleaned = '+421' + cleaned.substring(1);
  }
  
  // Formátovanie slovenskej a českej predvoľby (+421 9XX XXX XXX)
  if (cleaned.startsWith('+421') || cleaned.startsWith('+420')) {
    const country = cleaned.substring(0, 4);
    const rest = cleaned.substring(4);
    if (rest.length === 0) return country;
    if (rest.length <= 3) return `${country} ${rest}`;
    if (rest.length <= 6) return `${country} ${rest.substring(0, 3)} ${rest.substring(3)}`;
    return `${country} ${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6, 9)}`;
  }
  
  return phone;
};

export const formatName = (name: string): string => {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const formatAddress = (address: string): string => {
  if (!address) return "";
  // Odstránime zbytočné dvojité medzery
  let formatted = address.replace(/\s{2,}/g, ' ').trim();
  // Nájde 5 po sebe idúcich čísiel alebo oddelených jednou medzerou a sformátuje na XXX XX (PSČ)
  formatted = formatted.replace(/\b(\d{3})\s*(\d{2})\b/g, '$1 $2');
  return formatted;
};


// --- ZOD VALIDAČNÉ SCHÉMY ---

export const validationSchemas = {
  firstName: z.string().min(2, "Meno musí mať aspoň 2 znaky.").max(50, "Meno je príliš dlhé."),
  lastName: z.string().min(2, "Priezvisko musí mať aspoň 2 znaky.").max(50, "Priezvisko je príliš dlhé."),
  phone: z.string()
    .min(9, "Telefónne číslo je príliš krátke.")
    .regex(/^\+?[0-9\s]+$/, "Telefónne číslo má nesprávny formát (môže obsahovať len čísla a znak +)."),
  address: z.string().min(10, "Adresa je príliš krátka. Zadajte Ulicu, Číslo, PSČ a Mesto."),
  email: z.string().email("Neplatný formát e-mailovej adresy."),
};

// --- HELPER PRE BEŽNÚ VALIDÁCIU OBJEKTOV ---
// Pomocná funkcia, ktorá prebehne Zod schémy a vráti string s prvou chybou (alebo null ak je OK)
export const validateField = (field: keyof typeof validationSchemas, value: string): string | null => {
  const schema = validationSchemas[field];
  if (!schema) return null;
  
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.issues[0].message;
  }
  return null;
};
