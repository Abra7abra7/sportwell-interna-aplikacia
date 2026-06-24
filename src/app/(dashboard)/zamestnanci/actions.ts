"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const employeeInviteSchema = z.object({
  fullName: z.string().min(2, "Meno a priezvisko musí mať aspoň 2 znaky.").max(100),
  email: z.string().email("Neplatný formát e-mailu."),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(200).optional().or(z.literal("")),
  roleTitle: z.string().min(1, "Rola je povinná."),
});

const employeeUpdateSchema = z.object({
  fullName: z.string().min(2, "Meno a priezvisko musí mať aspoň 2 znaky.").max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
  roleTitle: z.string().min(1, "Rola je povinná."),
});

const pendingUpdateSchema = z.object({
  fullName: z.string().min(2, "Meno a priezvisko musí mať aspoň 2 znaky.").max(100),
  email: z.string().email("Neplatný formát e-mailu."),
  phone: z.string().max(30).optional().or(z.literal("")),
  roleTitle: z.string().min(1, "Rola je povinná."),
});

// Helper na overenie, či má aktuálny používateľ rolu admin alebo majitel
async function checkAuth(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Neautorizovaný prístup. Prihláste sa prosím.");
  }

  const { data: profile, error: dbError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (dbError || !profile || !["admin", "majitel"].includes(profile.role)) {
    throw new Error("Nedostatočné oprávnenia. Iba Administrátor a Majiteľ môžu spravovať zamestnancov.");
  }

  return user.id;
}

export async function inviteEmployeeAction(data: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  roleTitle: string;
}) {
  const supabase = await createClient();
  const userId = await checkAuth(supabase);

  const validation = employeeInviteSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { fullName, email, phone, address, roleTitle } = validation.data;

  const { error } = await supabase.from("employee_invitations").insert({
    email,
    full_name: fullName,
    phone: phone || "",
    address: address || "",
    role_title: roleTitle,
    created_by: userId,
  });

  if (error) {
    console.error("Error inviting employee:", error);
    throw new Error("Chyba pri vytváraní pozvánky: " + error.message);
  }

  revalidatePath("/zamestnanci");
}

export async function toggleEmployeeActiveAction(employeeId: string, isCurrentlyActive: boolean) {
  const supabase = await createClient();
  await checkAuth(supabase);

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: !isCurrentlyActive })
    .eq("id", employeeId);

  if (error) {
    console.error("Error toggling employee active state:", error);
    throw new Error("Chyba pri zmene aktívneho stavu: " + error.message);
  }

  revalidatePath("/zamestnanci");
}

export async function deleteActiveEmployeeAction(employeeId: string, currentMetadata: any) {
  const supabase = await createClient();
  await checkAuth(supabase);

  const updatedMetadata = {
    ...(currentMetadata || {}),
    inactive: true,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      role: "klient",
      metadata: updatedMetadata,
    })
    .eq("id", employeeId);

  if (error) {
    console.error("Error deleting active employee:", error);
    throw new Error("Chyba pri odstraňovaní zamestnanca: " + error.message);
  }

  revalidatePath("/zamestnanci");
}

export async function deletePendingInviteAction(inviteId: string) {
  const supabase = await createClient();
  await checkAuth(supabase);

  const { error } = await supabase
    .from("employee_invitations")
    .delete()
    .eq("id", inviteId);

  if (error) {
    console.error("Error deleting pending invite:", error);
    throw new Error("Chyba pri rušení pozvánky: " + error.message);
  }

  revalidatePath("/zamestnanci");
}

export async function updateActiveEmployeeAction(
  employeeId: string,
  currentMetadata: any,
  data: {
    fullName: string;
    phone: string;
    roleTitle: string;
  }
) {
  const supabase = await createClient();
  await checkAuth(supabase);

  const validation = employeeUpdateSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { fullName, phone, roleTitle } = validation.data;
  const newMetadata = { ...(currentMetadata || {}), position: roleTitle };

  let newInternalRole = "trener";
  if (roleTitle === "Administrátor") newInternalRole = "admin";
  else if (roleTitle === "Recepcia") newInternalRole = "recepcia";

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || "",
      role: newInternalRole,
      metadata: newMetadata,
    })
    .eq("id", employeeId);

  if (error) {
    console.error("Error updating active employee:", error);
    throw new Error("Chyba pri aktualizácii zamestnanca: " + error.message);
  }

  revalidatePath("/zamestnanci");
}

export async function updatePendingInviteAction(
  inviteId: string,
  data: {
    fullName: string;
    email: string;
    phone: string;
    roleTitle: string;
  }
) {
  const supabase = await createClient();
  await checkAuth(supabase);

  const validation = pendingUpdateSchema.safeParse(data);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const { fullName, email, phone, roleTitle } = validation.data;

  const { error } = await supabase
    .from("employee_invitations")
    .update({
      email,
      full_name: fullName,
      phone: phone || "",
      role_title: roleTitle,
    })
    .eq("id", inviteId);

  if (error) {
    console.error("Error updating pending invite:", error);
    throw new Error("Chyba pri úprave pozvánky: " + error.message);
  }

  revalidatePath("/zamestnanci");
}
