import { redirect } from "next/navigation";

export default function RootPage() {
  // Tento root komponent len presmeruje na dashboard,
  // kde sa neskôr v middleware alebo v layoute rozhodne,
  // či je user prihlásený a či pôjde na /login.
  redirect("/dashboard");
}
