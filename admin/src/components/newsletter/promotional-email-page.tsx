"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  Users,
} from "lucide-react";

import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { AdminAppShell } from "@/components/layout/admin-app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  fetchNewsletterSubscribers,
  sendPromotionalEmail,
  type NewsletterSubscriber,
} from "@/services/api/newsletter";
import type { SiteCode } from "@/types/auth";

export function PromotionalEmailPage({ siteCode }: { siteCode: SiteCode }) {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Email selection
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Email composer form
  const [subject, setSubject] = useState("");
  const [messageHtml, setMessageHtml] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Load subscribers
  const loadSubscribers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchNewsletterSubscribers(siteCode);
      setSubscribers(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load newsletter subscribers";
      setError(msg);
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [siteCode]);

  useEffect(() => {
    loadSubscribers();
  }, [loadSubscribers]);

  // Active subscribers are eligible for selection
  const activeSubscribers = useMemo(
    () => subscribers.filter((sub) => sub.isActive),
    [subscribers],
  );

  // Filtered subscribers based on search (only active subscribers)
  const filteredSubscribers = useMemo(() => {
    const base = activeSubscribers;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter((sub) => sub.email.toLowerCase().includes(q));
  }, [activeSubscribers, searchQuery]);

  // Master checkbox status
  const isAllSelected = useMemo(() => {
    if (activeSubscribers.length === 0) return false;
    return activeSubscribers.every((sub) => selectedEmails.has(sub.email));
  }, [activeSubscribers, selectedEmails]);

  const isSomeSelected = useMemo(() => {
    if (isAllSelected || activeSubscribers.length === 0) return false;
    return activeSubscribers.some((sub) => selectedEmails.has(sub.email));
  }, [activeSubscribers, selectedEmails, isAllSelected]);

  // Handle master toggle
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(activeSubscribers.map((sub) => sub.email)));
    }
  };

  // Toggle single email
  const handleToggleEmail = (email: string) => {
    const next = new Set(selectedEmails);
    if (next.has(email)) {
      next.delete(email);
    } else {
      next.add(email);
    }
    setSelectedEmails(next);
  };

  // Reset composer
  const handleCancel = () => {
    setSubject("");
    setMessageHtml("");
  };

  // Send promotional email
  const handleSend = async () => {
    if (selectedEmails.size === 0) {
      showError("Please select at least one recipient email address.");
      return;
    }
    if (!subject.trim()) {
      showError("Please provide an email subject.");
      return;
    }
    const cleanMessage = messageHtml.replace(/<[^>]*>/g, "").trim();
    if (!cleanMessage && !messageHtml.includes("<img")) {
      showError("Please write an email message description.");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendPromotionalEmail(siteCode, {
        recipients: Array.from(selectedEmails),
        subject: subject.trim(),
        messageHtml,
      });

      showSuccess(
        `Promotional email sent successfully to ${result.sentCount} recipient(s)!` +
          (result.failedCount > 0 ? ` (${result.failedCount} failed)` : ""),
      );

      // Reset form
      setSubject("");
      setMessageHtml("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send promotional email";
      showError(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AdminAppShell
      siteCode={siteCode}
      title="Promotional Email"
      description="Manage newsletter subscribers and send promotional email campaigns with one-click unsubscribe support."
    >
      <div className="space-y-6">
        {/* Error Banner */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>Failed to load subscribers</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadSubscribers}
                className="ml-4 h-7 text-xs"
              >
                <RefreshCw className="mr-1.5 size-3" /> Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 2-Partition Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Partition: Subscribers List */}
          <div className="lg:col-span-4 xl:col-span-4">
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              {/* Header: All Registered Users Count */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  All Registered Users:{" "}
                  <span className="font-semibold text-foreground">
                    {activeSubscribers.length}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={loadSubscribers}
                  disabled={isLoading}
                  title="Refresh subscriber list"
                >
                  <RefreshCw
                    className={cn("size-3.5", isLoading && "animate-spin text-primary")}
                  />
                </Button>
              </div>

              {/* Subheader: Select Recipients & Master Checkbox */}
              <div className="flex items-center justify-between pb-3 border-b border-border/80">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <Checkbox
                    checked={
                      isAllSelected ? true : isSomeSelected ? "indeterminate" : false
                    }
                    onCheckedChange={handleToggleSelectAll}
                    disabled={activeSubscribers.length === 0}
                    className="data-checked:bg-primary data-checked:border-primary"
                  />
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    Select Recipients ({selectedEmails.size})
                  </span>
                </label>
                {selectedEmails.size > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedEmails(new Set())}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Optional Search Filter */}
              {subscribers.length > 5 && (
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              )}

              {/* Email Items Container */}
              <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
                {isLoading && subscribers.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <span className="text-xs">Loading subscribers...</span>
                  </div>
                ) : filteredSubscribers.length === 0 ? (
                  <div className="py-12 px-4 text-center text-muted-foreground text-xs space-y-2 rounded-lg border border-dashed border-border">
                    <Mail className="size-8 mx-auto text-muted-foreground/50" />
                    <p className="font-medium text-foreground">No subscribers found</p>
                    <p>
                      {searchQuery
                        ? "No matching emails for this search."
                        : "When customers submit their email in the storefront footer, they will appear here."}
                    </p>
                  </div>
                ) : (
                  filteredSubscribers.map((subscriber) => {
                    const isSelected = selectedEmails.has(subscriber.email);

                    return (
                      <div
                        key={subscriber.id}
                        onClick={() => handleToggleEmail(subscriber.email)}
                        className={cn(
                          "flex items-center gap-3 px-3.5 py-3 rounded-lg border transition-all text-sm select-none cursor-pointer",
                          isSelected
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "bg-background hover:bg-muted/40 border-border shadow-xs",
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleEmail(subscriber.email)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-xs sm:text-sm font-medium truncate",
                              isSelected ? "text-foreground font-semibold" : "text-muted-foreground",
                            )}
                          >
                            {subscriber.email}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Partition: Promotional Email Composer */}
          <div className="lg:col-span-8 xl:col-span-8">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="border-b border-border/80 pb-4">
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  Send Promotional Email
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Compose promotional announcements, discount campaigns, and product updates for selected subscribers.
                </p>
              </div>

              {/* Email Subject Input */}
              <div className="space-y-2">
                <Label htmlFor="email-subject" className="text-sm font-medium text-foreground">
                  Email Subject
                </Label>
                <Input
                  id="email-subject"
                  placeholder="Enter email subject..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isSending}
                  className="h-10 text-sm"
                />
              </div>

              {/* Email Message Description with TipTap RichTextEditor */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Email Message
                </Label>
                <div className="border border-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <RichTextEditor
                    value={messageHtml}
                    onChange={setMessageHtml}
                    placeholder="Write your promotional email here..."
                    minHeightClassName="min-h-[340px]"
                    disabled={isSending}
                  />
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSending || (!subject && !messageHtml)}
                  className="px-5 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSend}
                  disabled={
                    isSending ||
                    selectedEmails.size === 0 ||
                    !subject.trim() ||
                    !messageHtml.trim()
                  }
                  className="px-6 text-sm gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending to {selectedEmails.size} Recipient(s)...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Send to Selected ({selectedEmails.size})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminAppShell>
  );
}
