"use client";

import {
  AlertCircle,
  Clock,
  Package,
  PackageCheck,
  ShoppingCart,
  Truck,
  type LucideIcon,
} from "lucide-react";

interface OrderStatusTrackerProps {
  status: string;
  statusMessage?: string | null;
  updatedAt?: string | null;
}

interface StepItem {
  stage: number;
  title: string;
  icon: LucideIcon;
}

const STEPS: StepItem[] = [
  {
    stage: 1,
    title: "Order confirmation",
    icon: ShoppingCart,
  },
  {
    stage: 2,
    title: "Order fulfilling and processing",
    icon: Package,
  },
  {
    stage: 3,
    title: "Shipping and delivery",
    icon: Truck,
  },
  {
    stage: 4,
    title: "Post-delivery",
    icon: PackageCheck,
  },
];

function getStageFromStatus(statusRaw: string): { stage: number; isCancelled: boolean } {
  const s = statusRaw?.toUpperCase()?.trim();
  if (s === "CANCELLED" || s === "REFUNDED") {
    return { stage: 0, isCancelled: true };
  }
  if (s === "DELIVERED") {
    return { stage: 4, isCancelled: false };
  }
  if (s === "SHIPPED") {
    return { stage: 3, isCancelled: false };
  }
  if (s === "PROCESSING") {
    return { stage: 2, isCancelled: false };
  }
  // PENDING, CONFIRMED or other defaults to stage 1
  return { stage: 1, isCancelled: false };
}

export function OrderStatusTracker({ status, statusMessage }: OrderStatusTrackerProps) {
  const { stage: currentStage, isCancelled } = getStageFromStatus(status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Order Tracking
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            Track your order
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Follow your order's journey in real time.
          </p>
        </div>

        {isCancelled ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-600 ring-1 ring-inset ring-rose-200">
            <AlertCircle className="size-3.5" />
            Order Cancelled
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-100">
            <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
            {status}
          </span>
        )}
      </div>

      {/* Cancelled State */}
      {isCancelled ? (
        <div className="flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/70 p-4">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-500" />
          <div>
            <p className="text-sm font-semibold text-rose-800">
              This order has been cancelled.
            </p>
            <p className="mt-1 text-xs leading-5 text-rose-700">
              {statusMessage ||
                "If you have questions regarding this cancellation, please contact our support team."}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Progress Timeline */}
          <div className="pt-2">
            <div className="relative grid grid-cols-4 gap-1 sm:gap-3">
              {STEPS.map((step, idx) => {
                const isFulfilled = currentStage > step.stage;
                const isLive = currentStage === step.stage;
                const isFuture = currentStage < step.stage;
                const IconComponent = step.icon;

                return (
                  <div
                    key={step.stage}
                    className="relative flex min-w-0 flex-col items-center"
                  >
                    {/* Connector */}
                    {idx < STEPS.length - 1 && (
                      <div className="absolute left-[60%] right-[-40%] top-5 z-0 flex items-center">
                        <div
                          className={`h-0.5 w-full rounded-full transition-colors duration-300 ${currentStage >= STEPS[idx + 1].stage
                              ? "bg-blue-500"
                              : "bg-slate-200"
                            }`}
                        />
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`relative z-10 flex size-10 items-center justify-center rounded-full transition-all duration-300 sm:size-11 ${
                        isLive
                          ? "bg-blue-600 text-white ring-4 ring-blue-100 shadow-sm"
                          : isFulfilled
                            ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                            : "border border-slate-200 bg-slate-50 text-slate-400"
                      }`}
                    >
                      <IconComponent
                        className="size-5 sm:size-5.5 shrink-0 transition-colors"
                        strokeWidth={2}
                      />
                    </div>

                    {/* Step Label */}
                    <div className="mt-3 w-full px-0.5 text-center">
                      <p
                        className={`text-[13px] leading-4 sm:font-medium ${isLive
                            ? "font-semibold text-blue-700"
                            : isFulfilled
                              ? "font-medium text-slate-800"
                              : "text-slate-400"
                          }`}
                      >
                        {step.title}
                      </p>

                      {isLive && (
                        <span className="mt-1 inline-block rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 sm:px-2">
                          In progress
                        </span>
                      )}

                      {isFulfilled && (
                        <span className="mt-1 block text-[10px] text-slate-400">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Latest Update */}
          {statusMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 sm:p-4">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-blue-100">
                <Clock className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                  Latest update
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-700">
                  {statusMessage}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
