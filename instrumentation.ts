import { assertProductionUploadEnv } from "@/lib/uploadEnv";

export async function register() {
  assertProductionUploadEnv();
}
