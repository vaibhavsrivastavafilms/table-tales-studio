"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSkeleton from "@/components/DashboardSkeleton";
import Sidebar from "@/components/Sidebar";
import {
  createProject,
  deleteProject,
  duplicateProject,
  listProjects,
  updateProject,
  type Project,
} from "@/lib/projects";
import { isSupabaseConfigured } from "@/lib/supabase";
import { TEMPLATE_LIST } from "@/lib/templates";
import CreatorAnalyticsCard from "@/components/CreatorAnalyticsCard";
import EmptyState from "@/components/EmptyState";
import { canCreateProject } from "@/lib/usage";
import { trackEvent } from "@/lib/analytics";

export default function ProjectsHome() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    try {
      setProjects(await listProjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (templateId?: string) => {
    if (!isSupabaseConfigured()) {
      router.push("/dashboard/local");
      return;
    }

    const limit = canCreateProject(projects.length);
    if (!limit.allowed) {
      setError(limit.reason);
      return;
    }

    setBusyId("new");
    try {
      const tid = (templateId as Project["templateId"]) ?? "street-food";
      const project = await createProject("Untitled Carousel", tid);
      await trackEvent("template_used", { templateId: tid });
      router.push(`/dashboard/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project");
    } finally {
      setBusyId(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusyId(id);
    try {
      const copy = await duplicateProject(id);
      await load();
      router.push(`/dashboard/${copy.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await updateProject(id, { title });
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, title } : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
    }
  };

  if (loading) {
    return (
      <main className="dashboard-main min-h-screen overflow-x-hidden bg-[#f7c600] p-4 md:p-6">
        <div className="mx-auto max-w-[1600px]">
          <DashboardSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-main min-h-screen overflow-x-hidden bg-[#f7c600] p-4 text-white md:p-6">
      <div className="mx-auto min-w-0 max-w-[1600px]">
        <header className="mb-6 md:mb-10">
          <h1 className="text-3xl font-bold text-black sm:text-5xl xl:text-7xl">
            Table Tales Studio
          </h1>
          <p className="mt-2 text-base text-black sm:text-xl">
            Your creator workspace
          </p>
        </header>

        <div className="flex min-w-0 flex-col gap-4 xl:grid xl:grid-cols-12 xl:gap-6">
          <div className="min-w-0 xl:col-span-2">
            <Sidebar />
          </div>

          <div className="min-w-0 xl:col-span-10">
            {error && (
              <p className="mb-4 rounded-xl bg-red-950/90 px-4 py-3 text-sm text-red-100">
                {error}
              </p>
            )}

            {isSupabaseConfigured() && (
              <CreatorAnalyticsCard projectCount={projects.length} />
            )}

            <section className="mb-6 rounded-[40px] bg-[#0b0f1a] p-6 ring-1 ring-white/5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#f7c600]">
                    Workspace
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">Recent projects</h2>
                </div>
                <button
                  type="button"
                  disabled={busyId === "new"}
                  onClick={() => handleCreate()}
                  className="min-h-[44px] rounded-xl bg-[#f7c600] px-6 py-3 text-sm font-bold text-black disabled:opacity-50"
                >
                  {busyId === "new" ? "Creating…" : "Create new carousel"}
                </button>
              </div>
            </section>

            <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATE_LIST.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={busyId === "new"}
                  onClick={() => handleCreate(t.id)}
                  className="rounded-2xl border border-zinc-800 bg-black/40 p-4 text-left transition-all hover:border-[#f7c600]/40 hover:shadow-[0_0_24px_rgba(247,198,0,0.08)]"
                >
                  <p
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: t.accentColor }}
                  >
                    Quick start
                  </p>
                  <p className="mt-2 font-bold text-white">{t.name}</p>
                </button>
              ))}
            </section>

            {!isSupabaseConfigured() ? (
              <section className="rounded-[40px] bg-[#0b0f1a] p-8 ring-1 ring-white/5">
                <EmptyState
                  icon="☁"
                  title="Local studio mode"
                  description="Add Supabase keys for cloud projects — or keep creating with autosaved local drafts."
                  actionLabel="Open local editor"
                  onAction={() => router.push("/dashboard/local")}
                  secondaryLabel="Try sample story"
                  onSecondary={() => router.push("/dashboard/demo")}
                />
              </section>
            ) : projects.length === 0 ? (
              <section className="rounded-[40px] bg-[#0b0f1a] p-8 ring-1 ring-white/5">
                <EmptyState
                  icon="✨"
                  title="Your first carousel is one click away"
                  description="Food creators start here — pick a template or explore our cinematic restaurant demo."
                  actionLabel="Create project"
                  onAction={() => handleCreate()}
                  secondaryLabel="Open sample demo"
                  onSecondary={() => router.push("/dashboard/demo")}
                />
              </section>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {projects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-2xl border border-zinc-800 bg-[#0b0f1a] p-5 ring-1 ring-white/5"
                  >
                    <input
                      defaultValue={project.title}
                      onBlur={(e) => {
                        const title = e.target.value.trim() || "Untitled Carousel";
                        if (title !== project.title) {
                          handleRename(project.id, title);
                        }
                      }}
                      className="w-full bg-transparent text-lg font-bold text-white focus:outline-none focus:ring-1 focus:ring-[#f7c600]/40"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Updated {new Date(project.updatedAt).toLocaleString()}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/${project.id}`}
                        className="rounded-lg bg-[#f7c600] px-4 py-2 text-xs font-bold text-black"
                      >
                        Continue editing
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === project.id}
                        onClick={() => handleDuplicate(project.id)}
                        className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-white disabled:opacity-50"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        disabled={busyId === project.id}
                        onClick={() => handleDelete(project.id)}
                        className="rounded-lg border border-red-900/50 px-3 py-2 text-xs text-red-300 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
