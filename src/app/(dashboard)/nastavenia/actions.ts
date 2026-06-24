"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const rolePermissionSchema = z.object({
  role: z.string().min(1, "Rola je povinná."),
  module_id: z.string().min(1, "Modul ID je povinný."),
  can_read: z.boolean(),
  can_write: z.boolean(),
  can_delete: z.boolean(),
});

export type RolePermissionInput = z.infer<typeof rolePermissionSchema>;

async function checkAdminOrMajitel(supabase: any) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("Neautorizovaný prístup. Prihláste sa prosím.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "majitel"].includes(profile.role)) {
    throw new Error("Nemáte dostatočné práva na prístup k nastaveniam.");
  }

  return user.id;
}

export async function savePermissionsAction(permissions: RolePermissionInput[]) {
  const supabase = await createClient();
  await checkAdminOrMajitel(supabase);

  const validation = z.array(rolePermissionSchema).safeParse(permissions);
  if (!validation.success) {
    throw new Error("Neplatné vstupné údaje: " + validation.error.issues.map(i => i.message).join(", "));
  }

  const upsertPayload = validation.data.map(p => ({
    role: p.role,
    module_id: p.module_id,
    can_read: p.can_read,
    can_write: p.can_write,
    can_delete: p.can_delete,
  }));

  const { error } = await supabase
    .from("role_permissions")
    .upsert(upsertPayload, { onConflict: "role, module_id" });

  if (error) {
    console.error("Error upserting role permissions:", error);
    throw new Error("Chyba pri ukladaní oprávnení: " + error.message);
  }

  revalidatePath("/nastavenia");
}
