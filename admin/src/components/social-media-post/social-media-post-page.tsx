"use client";

import { useCallback, useEffect, useState } from "react";

import { SocialMediaPostForm } from "@/components/social-media-post/social-media-post-form";
import { SocialMediaPostTable } from "@/components/social-media-post/social-media-post-table";
import {
  FacebookIcon,
  InstagramIcon,
} from "@/components/social-media-post/social-platform-icons";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/lib/toast";
import {
  toSocialPostPayload,
  validateSocialPostForm,
  type SocialPostFormErrors,
} from "@/schemas/social-media-post-schema";
import {
  createSocialPost,
  deleteSocialPost,
  fetchSocialPosts,
  patchSocialPost,
  updateSocialPost,
} from "@/services/api/social-media-post";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type {
  SocialPostDto,
  SocialPostFormValues,
  SocialPostType,
} from "@/types/social-media-post";

function createEmptyFormValues(postType: SocialPostType): SocialPostFormValues {
  return {
    postType,
    imageUrl: "",
    imagePublicId: "",
    postUrl: "",
    active: true,
    order: "",
  };
}

function dtoToFormValues(post: SocialPostDto): SocialPostFormValues {
  return {
    postType: post.postType,
    imageUrl: post.imageUrl,
    imagePublicId: post.imagePublicId,
    postUrl: post.postUrl,
    active: post.active,
    order: String(post.order ?? ""),
  };
}

export function SocialMediaPostPage({ siteCode }: { siteCode: SiteCode }) {
  const [activeTab, setActiveTab] = useState<SocialPostType>("instagram");
  const [posts, setPosts] = useState<SocialPostDto[]>([]);
  const [values, setValues] = useState<SocialPostFormValues>(() =>
    createEmptyFormValues("instagram"),
  );
  const [errors, setErrors] = useState<SocialPostFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SocialPostDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSocialPosts(siteCode, activeTab);
      setPosts(data);
    } catch (error) {
      setLoadError(
        error instanceof ApiError ? error.message : "Failed to load social posts",
      );
      showError(
        error instanceof ApiError ? error.message : "Failed to load social posts",
      );
    } finally {
      setIsLoading(false);
    }
  }, [siteCode, activeTab]);

  useEffect(() => {
    // Intentional data-fetch for the selected site + platform tab.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- social posts fetch
    void load();
  }, [load]);

  const resetForm = (postType: SocialPostType = activeTab) => {
    setValues(createEmptyFormValues(postType));
    setEditingId(null);
    setErrors({});
  };

  const handleTabChange = (tab: SocialPostType) => {
    if (activeTab === tab) return;
    setActiveTab(tab);
    resetForm(tab);
    setPendingDelete(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validation = validateSocialPostForm({
      ...values,
      postType: activeTab,
    });
    if (!validation.success) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors).find(Boolean);
      if (firstError) showError(firstError);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const payload = toSocialPostPayload(
        { ...validation.data, postType: activeTab },
        posts.length + 1,
      );
      if (editingId) {
        await updateSocialPost(siteCode, editingId, payload);
        showSuccess(
          `${activeTab === "instagram" ? "Instagram" : "Facebook"} post updated`,
        );
      } else {
        await createSocialPost(siteCode, payload);
        showSuccess(
          `${activeTab === "instagram" ? "Instagram" : "Facebook"} post added`,
        );
      }
      resetForm();
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to save social post",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (post: SocialPostDto) => {
    setEditingId(post.id);
    setValues(dtoToFormValues(post));
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (post: SocialPostDto) => {
    try {
      await deleteSocialPost(siteCode, post.id);
      showSuccess("Post deleted successfully");
      if (editingId === post.id) {
        resetForm();
      }
      setPendingDelete(null);
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to delete social post",
      );
    }
  };

  const handleToggleActive = async (post: SocialPostDto) => {
    try {
      await patchSocialPost(siteCode, post.id, { active: !post.active });
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError
          ? error.message
          : "Failed to update post visibility",
      );
    }
  };

  const handleMove = async (post: SocialPostDto, direction: "up" | "down") => {
    const sorted = [...posts].sort(
      (left, right) => (left.order || 0) - (right.order || 0),
    );
    const index = sorted.findIndex((item) => item.id === post.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;

    const other = sorted[swapIndex]!;
    try {
      await Promise.all([
        patchSocialPost(siteCode, post.id, { order: other.order }),
        patchSocialPost(siteCode, other.id, { order: post.order }),
      ]);
      await load();
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to reorder posts",
      );
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Social Media Posts"
      description="Manage Instagram and Facebook posts shown on the storefront."
    >
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Social Media Posts
            </h2>
            <p className="text-sm text-muted-foreground">
              Site-scoped posts for {siteCode === "IN" ? ".in" : ".com"}.
            </p>
          </div>
          <div className="flex items-center rounded-xl border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => handleTabChange("instagram")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "instagram"
                  ? "border border-border/60 bg-background text-pink-600 shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              }`}
            >
              <InstagramIcon className="size-4" />
              Instagram
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("facebook")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                activeTab === "facebook"
                  ? "border border-border/60 bg-background text-blue-600 shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              }`}
            >
              <FacebookIcon className="size-4" />
              Facebook
            </button>
          </div>
        </div>

        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Could not load social posts</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {pendingDelete ? (
          <Alert>
            <AlertTitle>Delete post?</AlertTitle>
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Delete this {activeTab} post? This action cannot be undone.
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPendingDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void handleDelete(pendingDelete)}
                >
                  Delete
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-8">
          <SocialMediaPostForm
            siteCode={siteCode}
            values={values}
            errors={errors}
            isSubmitting={isSubmitting}
            isEditing={Boolean(editingId)}
            editingId={editingId}
            activeTab={activeTab}
            onChange={setValues}
            onSubmit={(event) => void handleSubmit(event)}
            onReset={() => resetForm()}
          />

          {isLoading ? (
            <div className="h-80 animate-pulse rounded-xl border border-border bg-muted/40" />
          ) : (
            <SocialMediaPostTable
              posts={posts}
              activeTab={activeTab}
              onEdit={handleEdit}
              onDelete={(post) => setPendingDelete(post)}
              onToggleActive={(post) => void handleToggleActive(post)}
              onMove={(post, direction) => void handleMove(post, direction)}
            />
          )}
        </div>
      </div>
    </AdminAppShell>
  );
}
