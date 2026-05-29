import {
  blobToDataUrl,
  processUploadFilesSafe,
  replaceObjectUrls,
} from "@/lib/images";
import {
  errorMessage,
  logUploadFailure,
  UploadPipelineError,
  type UploadStage,
} from "@/lib/uploadDiagnostics";
import { initClientUploadEnv } from "@/lib/uploadEnv";
import {
  BUCKETS,
  probeProjectImagesBucket,
  uploadProjectImages,
} from "@/lib/storage";
import { isValidUuid } from "@/lib/validation";
import { createBrowserClient, isSupabaseConfigured } from "@/lib/supabase";

export type UploadProgressHandler = (stage: UploadStage) => void;

export type UploadPipelineResult = {
  urls: string[];
  usedLocalFallback: boolean;
  cloudAttempted: boolean;
  warnings: string[];
};

export type UploadPipelineOptions = {
  onProgress?: UploadProgressHandler;
};

function report(options: UploadPipelineOptions | undefined, stage: UploadStage) {
  options?.onProgress?.(stage);
}

export async function uploadImagesForProject(
  projectId: string | null,
  files: File[],
  previousUrls: string[] = [],
  options?: UploadPipelineOptions
): Promise<UploadPipelineResult> {
  initClientUploadEnv();

  if (projectId && !isValidUuid(projectId)) {
    throw new UploadPipelineError({
      code: "invalid_project_id",
      message: "Invalid project id",
      stage: "validating",
    });
  }

  report(options, "validating");
  report(options, "optimizing");

  const processed = await processUploadFilesSafe(files);
  const displayUrls = processed.map((p) => p.displayUrl);
  let finalUrls = [...displayUrls];
  const warnings: string[] = [];
  let usedLocalFallback = false;
  let cloudAttempted = false;

  const persistWithoutCloud = async () => {
    report(options, "fallback");
    try {
      finalUrls = await Promise.all(
        processed.map((p) => blobToDataUrl(p.storageBlob))
      );
      replaceObjectUrls(displayUrls, finalUrls);
    } catch (err) {
      logUploadFailure(err, {
        code: "invalid_base64",
        stage: "fallback",
        uploadTarget: "data_url",
        message: "Could not persist images as data URLs — keeping local previews",
      });
      finalUrls = [...displayUrls];
      usedLocalFallback = true;
      warnings.push("Using temporary local previews for this session");
    }
  };

  if (!isSupabaseConfigured() || !projectId) {
    await persistWithoutCloud();
    if (!isSupabaseConfigured()) {
      warnings.push("Cloud storage not configured — images stay in this browser");
    } else if (!projectId) {
      warnings.push("Save the project to enable cloud image sync");
    }
    replaceObjectUrls(previousUrls, []);
    report(options, "done");
    return {
      urls: finalUrls,
      usedLocalFallback: true,
      cloudAttempted: false,
      warnings,
    };
  }

  try {
    const supabase = createBrowserClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      logUploadFailure(authError, {
        code: "auth",
        stage: "uploading",
        message: authError.message,
        uploadTarget: "supabase",
      });
      warnings.push("Sign in to sync images to the cloud — using local previews");
      await persistWithoutCloud();
      replaceObjectUrls(previousUrls, []);
      report(options, "done");
      return {
        urls: finalUrls,
        usedLocalFallback: true,
        cloudAttempted: false,
        warnings,
      };
    }

    if (!user) {
      await persistWithoutCloud();
      warnings.push("Sign in to sync images to the cloud — using local previews");
      replaceObjectUrls(previousUrls, []);
      report(options, "done");
      return {
        urls: finalUrls,
        usedLocalFallback: true,
        cloudAttempted: false,
        warnings,
      };
    }

    cloudAttempted = true;
    report(options, "uploading");

    const bucketProbe = await probeProjectImagesBucket();
    if (!bucketProbe.ok) {
      logUploadFailure(new Error(bucketProbe.message ?? "bucket unreachable"), {
        code: "storage",
        stage: "uploading",
        message:
          bucketProbe.message ??
          `Storage bucket "${BUCKETS.projectImages}" unreachable — check Supabase policies`,
        uploadTarget: "supabase",
        bucket: BUCKETS.projectImages,
      });
      warnings.push("Cloud storage unavailable — using local previews");
      usedLocalFallback = true;
      finalUrls = [...displayUrls];
    } else {
      const uploadResult = await uploadProjectImages(
        user.id,
        projectId,
        processed.map((p) => p.storageBlob),
        displayUrls
      );
      finalUrls = uploadResult.urls;
      usedLocalFallback = uploadResult.usedLocalFallback;
      if (uploadResult.storageErrors > 0) {
        warnings.push(
          `${uploadResult.storageErrors} image(s) could not reach cloud storage — using local previews`
        );
      }
      replaceObjectUrls(displayUrls, finalUrls);
    }
  } catch (error) {
    logUploadFailure(error, {
      code: "storage",
      stage: "uploading",
      message: errorMessage(error),
      uploadTarget: "supabase",
    });
    warnings.push("Cloud upload failed — using local previews for generation");
    usedLocalFallback = true;
    finalUrls = [...displayUrls];
  }

  replaceObjectUrls(previousUrls, []);
  report(options, "done");

  return {
    urls: finalUrls,
    usedLocalFallback,
    cloudAttempted,
    warnings,
  };
}

export async function uploadImagesForProjectSafe(
  projectId: string | null,
  files: File[],
  previousUrls: string[] = [],
  options?: UploadPipelineOptions
): Promise<UploadPipelineResult> {
  try {
    return await uploadImagesForProject(
      projectId,
      files,
      previousUrls,
      options
    );
  } catch (error) {
    if (!(error instanceof UploadPipelineError)) {
      logUploadFailure(error, {
        code: "unknown",
        stage: "validating",
        message: errorMessage(error),
      });
      throw new UploadPipelineError({
        code: "unknown",
        message: errorMessage(error),
        stage: "validating",
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
    logUploadFailure(error, error.context);
    throw error;
  }
}
