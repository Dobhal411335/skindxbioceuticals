"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  ImagePlus,
  Lightbulb,
  MessageCircleQuestion,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import {
  createEmptyCard,
  createEmptyQa,
  moveItem,
} from "@/components/insights/insights-form-utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showError, showSuccess } from "@/lib/toast";
import type { InsightsFormErrors } from "@/schemas/insights-schema";
import { uploadInsightsImage } from "@/services/api/insights";
import { ApiError } from "@/services/api/errors";
import type { SiteCode } from "@/types/auth";
import type { InsightsFormValues } from "@/types/insights";

type InsightsFormProps = {
  siteCode: SiteCode;
  values: InsightsFormValues;
  errors: InsightsFormErrors;
  onChange: (next: InsightsFormValues) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  formId?: string;
};

export function InsightsForm({
  siteCode,
  values,
  errors,
  onChange,
  onSubmit,
  formId = "insights-form",
}: InsightsFormProps) {
  const cardFileRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const updateCard = (
    index: number,
    patch: Partial<InsightsFormValues["cards"][number]>,
  ) => {
    onChange({
      ...values,
      cards: values.cards.map((card, i) =>
        i === index ? { ...card, ...patch } : card,
      ),
    });
  };

  const updateQa = (
    index: number,
    patch: Partial<InsightsFormValues["qaItems"][number]>,
  ) => {
    onChange({
      ...values,
      qaItems: values.qaItems.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  };

  const handleCardUpload = async (index: number, file: File | undefined) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const uploaded = await uploadInsightsImage(siteCode, file);
      if (!uploaded.url) {
        throw new Error("Upload succeeded but no image URL was returned");
      }
      updateCard(index, {
        imageUrl: uploaded.url,
        imagePublicId: uploaded.publicId,
      });
      showSuccess("Image uploaded");
    } catch (error) {
      showError(
        error instanceof ApiError ? error.message : "Failed to upload image",
      );
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="space-y-6">
      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Blogs / banner cards</TabsTrigger>
          <TabsTrigger value="qa">Question & Answer</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">
                      Insight banner cards
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Image, category badge, name, date, and TipTap description for
                    the landing Insights grid.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() =>
                    onChange({
                      ...values,
                      cards: [...values.cards, createEmptyCard()],
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add insight card
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {errors.cards ? (
                <p className="text-xs text-destructive">{errors.cards}</p>
              ) : null}
              {values.cards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No insight cards yet. Add a card to populate the landing grid.
                </p>
              ) : null}

              {values.cards.map((card, index) => (
                <div
                  key={`card-${index}`}
                  className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Card {index + 1}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="mr-2 flex items-center gap-2">
                        <Switch
                          checked={card.active}
                          onCheckedChange={(checked) =>
                            updateCard(index, { active: checked })
                          }
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() =>
                          onChange({
                            ...values,
                            cards: moveItem(values.cards, index, "up"),
                          })
                        }
                        aria-label="Move card up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === values.cards.length - 1}
                        onClick={() =>
                          onChange({
                            ...values,
                            cards: moveItem(values.cards, index, "down"),
                          })
                        }
                        aria-label="Move card down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onChange({
                            ...values,
                            cards: values.cards.filter((_, i) => i !== index),
                          })
                        }
                        aria-label="Remove card"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                    <div className="space-y-2">
                      <Label>Image</Label>
                      {card.imageUrl ? (
                        <div className="overflow-hidden rounded-lg border border-border bg-muted/20">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin Cloudinary preview */}
                          <img
                            src={card.imageUrl}
                            alt=""
                            className="h-36 w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 text-muted-foreground">
                          <ImagePlus className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          disabled={uploadingIndex === index}
                          onClick={() => cardFileRefs.current[index]?.click()}
                        >
                          <Upload className="h-4 w-4" />
                          {uploadingIndex === index ? "Uploading…" : "Upload"}
                        </Button>
                        {card.imageUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              updateCard(index, {
                                imageUrl: "",
                                imagePublicId: "",
                              })
                            }
                          >
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <input
                        ref={(node) => {
                          cardFileRefs.current[index] = node;
                        }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => {
                          void handleCardUpload(index, event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="grid gap-2 sm:col-span-1">
                        <Label>Category</Label>
                        <Input
                          value={card.category}
                          onChange={(event) =>
                            updateCard(index, { category: event.target.value })
                          }
                          placeholder="e.g. Skin Care"
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-2 sm:col-span-1">
                        <Label>Date</Label>
                        <Input
                          type="date"
                          value={card.publishedAt}
                          onChange={(event) =>
                            updateCard(index, {
                              publishedAt: event.target.value,
                            })
                          }
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-2 sm:col-span-2">
                        <Label>Blog / insight name</Label>
                        <Input
                          value={card.name}
                          onChange={(event) =>
                            updateCard(index, { name: event.target.value })
                          }
                          placeholder="e.g. Anti aging with vitamin C"
                          className="h-11"
                        />
                      </div>
                      <div className="grid gap-2 sm:col-span-1">
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={card.order}
                          onChange={(event) =>
                            updateCard(index, { order: event.target.value })
                          }
                          className="h-11"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <RichTextEditor
                      value={card.description}
                      onChange={(html) =>
                        updateCard(index, { description: html })
                      }
                      placeholder="Write the insight description…"
                      minHeightClassName="min-h-[160px]"
                      onUploadImage={async (file) => {
                        const uploaded = await uploadInsightsImage(
                          siteCode,
                          file,
                        );
                        if (!uploaded.url) {
                          throw new Error("Upload succeeded but no image URL");
                        }
                        return uploaded.url;
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qa">
          <Card className="overflow-hidden border-border bg-card shadow-sm">
            <CardHeader className="border-b border-border/70 pb-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageCircleQuestion className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">
                      Question & Answer
                    </CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Landing Insights Q&A block — question name and TipTap answer.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2"
                  onClick={() =>
                    onChange({
                      ...values,
                      qaItems: [...values.qaItems, createEmptyQa()],
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Q&A
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {errors.qaItems ? (
                <p className="text-xs text-destructive">{errors.qaItems}</p>
              ) : null}
              {values.qaItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No Q&A items yet. Add questions for the landing Insights section.
                </p>
              ) : null}

              {values.qaItems.map((item, index) => (
                <div
                  key={`qa-${index}`}
                  className="space-y-4 rounded-xl border border-border bg-muted/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      Q&A {index + 1}
                    </p>
                    <div className="flex items-center gap-1">
                      <div className="mr-2 flex items-center gap-2">
                        <Switch
                          checked={item.active}
                          onCheckedChange={(checked) =>
                            updateQa(index, { active: checked })
                          }
                        />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() =>
                          onChange({
                            ...values,
                            qaItems: moveItem(values.qaItems, index, "up"),
                          })
                        }
                        aria-label="Move Q&A up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={index === values.qaItems.length - 1}
                        onClick={() =>
                          onChange({
                            ...values,
                            qaItems: moveItem(values.qaItems, index, "down"),
                          })
                        }
                        aria-label="Move Q&A down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onChange({
                            ...values,
                            qaItems: values.qaItems.filter((_, i) => i !== index),
                          })
                        }
                        aria-label="Remove Q&A"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                    <div className="grid gap-2">
                      <Label>Name / question</Label>
                      <Input
                        value={item.question}
                        onChange={(event) =>
                          updateQa(index, { question: event.target.value })
                        }
                        placeholder="e.g. Online store with a wide selection…"
                        className="h-11"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Order</Label>
                      <Input
                        type="number"
                        value={item.order}
                        onChange={(event) =>
                          updateQa(index, { order: event.target.value })
                        }
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Description / answer</Label>
                    <RichTextEditor
                      value={item.answer}
                      onChange={(html) => updateQa(index, { answer: html })}
                      placeholder="Write the answer…"
                      minHeightClassName="min-h-[140px]"
                      onUploadImage={async (file) => {
                        const uploaded = await uploadInsightsImage(
                          siteCode,
                          file,
                        );
                        if (!uploaded.url) {
                          throw new Error("Upload succeeded but no image URL");
                        }
                        return uploaded.url;
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </form>
  );
}
