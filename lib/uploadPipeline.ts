import {
  blobToDataUrl,
  processUploadFilesSafe,
  replaceObjectUrls,
} from "@/lib/images";
import { logMonitoring } from "@/lib/monitoring";
import { uploadProjectImages } from "@/lib/storage";
import { isValidUuid } from "@/lib/validation";
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export async function uploadImagesForProject(
  projectId: string | null,
  files: File[],
  previousUrls: string[] = []
): Promise<string[]> {
  if (projectId && !isValidUuid(projectId)) {
    throw new Error("Invalid project id");
  }

  const processed = await processUploadFilesSafe(files);
  const displayUrls = processed.map((p) => p.displayUrl);

  let finalUrls = displayUrls;

  if (isSupabaseConfigured() && projectId) {
    const supabase = createBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const cloudUrls = await uploadProjectImages(
        user.id,
        projectId,
        processed.map((p) => p.storageBlob)
      );
      finalUrls = cloudUrls;
      replaceObjectUrls(displayUrls, finalUrls);
    }
  } else {
    finalUrls = await Promise.all(
      processed.map((p) => blobToDataUrl(p.storageBlob))
    );
    replaceObjectUrls(displayUrls, []);
  }

  replaceObjectUrls(previousUrls, []);
  return finalUrls;
}

export async function uploadImagesForProjectSafe(
  projectId: string | null,
  files: File[],
  previousUrls: string[] = []
): Promise<string[]> {
  try {
    return await uploadImagesForProject(projectId, files, previousUrls);
  } catch (error) {
    logMonitoring("upload_failed", "error", {
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}
