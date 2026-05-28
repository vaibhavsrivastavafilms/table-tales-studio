import type { Captions } from "@/lib/slides";
import type { ProjectRow } from "@/lib/database.types";
import { createEmptyCaptions, draftTemplateId } from "@/lib/draftStorage";
import { DEFAULT_TEMPLATE_ID, type TemplateId } from "@/lib/templates";
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { logMonitoring } from "@/lib/monitoring";
import {
  isCaptionsPayloadValid,
  isValidUuid,
  parseTemplateId,
  sanitizeCaptions,
  sanitizeImageUrlList,
  sanitizeProjectTitle,
} from "@/lib/validation";

export type Project = {
  id: string;
  title: string;
  templateId: TemplateId;
  captions: Captions;
  images: string[];
  updatedAt: string;
};

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    title: sanitizeProjectTitle(row.title),
    templateId: draftTemplateId(row.template_id),
    captions: sanitizeCaptions({ ...createEmptyCaptions(), ...row.captions }),
    images: sanitizeImageUrlList(row.image_urls ?? []),
    updatedAt: row.updated_at,
  };
}

async function requireUserId(): Promise<string> {
  const supabase = createBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function listProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToProject);
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isSupabaseConfigured()) return null;
  if (!isValidUuid(id)) return null;

  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProject(data) : null;
}

export async function createProject(
  title = "Untitled Carousel",
  templateId: TemplateId = DEFAULT_TEMPLATE_ID
): Promise<Project> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }

  const userId = await requireUserId();
  const safeTitle = sanitizeProjectTitle(title);
  const safeTemplate = parseTemplateId(templateId);

  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      title: safeTitle,
      template_id: safeTemplate,
      captions: createEmptyCaptions(),
      image_urls: [],
    })
    .select("*")
    .single();

  if (error) throw error;

  const { trackEvent } = await import("@/lib/analytics");
  await trackEvent("project_created", { templateId: safeTemplate });

  return rowToProject(data);
}

export async function updateProject(
  id: string,
  patch: {
    title?: string;
    templateId?: TemplateId;
    captions?: Captions;
    images?: string[];
  }
): Promise<Project> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  if (!isValidUuid(id)) throw new Error("Invalid project id");

  const userId = await requireUserId();
  const supabase = createBrowserClient();

  const captions =
    patch.captions !== undefined ? sanitizeCaptions(patch.captions) : undefined;
  if (captions && !isCaptionsPayloadValid(captions)) {
    throw new Error("Captions payload too large");
  }

  const update = {
    updated_at: new Date().toISOString(),
    ...(patch.title !== undefined
      ? { title: sanitizeProjectTitle(patch.title) }
      : {}),
    ...(patch.templateId !== undefined
      ? { template_id: parseTemplateId(patch.templateId) }
      : {}),
    ...(captions !== undefined ? { captions } : {}),
    ...(patch.images !== undefined
      ? { image_urls: sanitizeImageUrlList(patch.images) }
      : {}),
  };

  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return rowToProject(data);
}

export async function duplicateProject(id: string): Promise<Project> {
  const source = await getProject(id);
  if (!source) throw new Error("Project not found");

  const copy = await createProject(`${source.title} (copy)`, source.templateId);
  return updateProject(copy.id, {
    captions: source.captions,
    images: source.images,
  });
}

export async function deleteProject(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  if (!isValidUuid(id)) return;

  const userId = await requireUserId();
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function getLatestProject(): Promise<Project | null> {
  const projects = await listProjects();
  return projects[0] ?? null;
}

export async function logExport(
  projectId: string | null,
  format: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return;
  }

  const safeProjectId =
    projectId && isValidUuid(projectId) ? projectId : null;
  const safeFormat = format === "png" ? "png" : "jpeg";

  const supabase = createBrowserClient();
  const { error } = await supabase.from("exports").insert({
    project_id: safeProjectId,
    user_id: userId,
    format: safeFormat,
  });

  if (error) {
    logMonitoring("export_log_failed", "warn");
  }
}
