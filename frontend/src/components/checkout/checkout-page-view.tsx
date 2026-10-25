"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import {

  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileImage,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { getCartLinePricing } from "@/components/cart/cart-line-price";
import { CartOrderSummaryRows } from "@/components/cart/cart-order-summary-rows";
import { QuantityStepper } from "@/components/cart/quantity-stepper";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cartLineTaxInPaise } from "@/features/cart/cart-tax";
import { checkoutService } from "@/features/checkout/checkout.service";
import type { RazorpaySuccessResponse } from "@/features/checkout/checkout.types";
import {
  createCheckoutIdempotencyKey,
  loadRazorpayCheckout,
} from "@/features/checkout/load-razorpay";
import { meService } from "@/features/me/me.service";
import type { Address } from "@/features/me/me.types";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { useAuth } from "@/hooks/useAuth";
import { useIsVendor } from "@/hooks/useIsVendor";
import { useCartActions } from "@/hooks/useCartActions";
import { useCartTaxEnrichment } from "@/hooks/useCartTaxEnrichment";
import { useCartTotals } from "@/hooks/useCartTotals";
import { showError, showInfo, showSuccess } from "@/lib/toast";
import { formatPaiseToInr } from "@/lib/utils";
import { setCartNotes } from "@/store/slices/cartSlice";
import {
  DEFAULT_COUNTRY_CODE,
  INDIA_STATES,
  isIndiaState,
} from "@/utils/states";
import { toApiError } from "@/services/api/errors";

const GUEST_TOKEN_KEY = "skindx_guest_checkout_token";
const GUEST_EMAIL_KEY = "skindx_guest_checkout_email";
const GUEST_VERIFIED_KEY = "skindx_guest_checkout_verified";
const CONFIRMATION_TOKEN_KEY = "skindx_order_confirmation_token";
const INDIA_DIAL_CODE = "+91";

type GuestStep = "email" | "otp" | "verified";

function clearGuestCheckoutStorage() {
  sessionStorage.removeItem(GUEST_TOKEN_KEY);
  sessionStorage.removeItem(GUEST_EMAIL_KEY);
  sessionStorage.removeItem(GUEST_VERIFIED_KEY);
}

/** Keep only a 10-digit Indian mobile; strip pasted +91 / leading 0. */
function normalizeIndianMobileDigits(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length >= 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
}

/** Persist / display format: `+91 9857465658`. */
function formatIndiaPhoneForCheckout(digits: string): string {
  return `${INDIA_DIAL_CODE} ${digits}`;
}

export function CheckoutPageView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isVendor = useIsVendor();
  const { setQuantity, setItemNote, remove, clear: clearCartAction } = useCartActions();
  const cartHydrated = useAppSelector((state) => state.cart.hydrated);
  const cartStatus = useAppSelector((state) => state.cart.status);
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);
  const [itemNoteDraft, setItemNoteDraft] = useState("");

  function startEditItemNote(itemId: string, currentNote?: string) {
    setEditingNoteItemId(itemId);
    setItemNoteDraft(currentNote || "");
  }

  function saveItemNote(itemId: string) {
    setItemNote(itemId, itemNoteDraft);
    setEditingNoteItemId(null);
    setItemNoteDraft("");
  }

  function cancelItemNote() {
    setEditingNoteItemId(null);
    setItemNoteDraft("");
  }
  const {
    items,
    extras,
    originalSubtotalInPaise,
    subtotalInPaise,
    discountInPaise,
    discountPercent,
    cgstInPaise,
    sgstInPaise,
    cgstPercent,
    sgstPercent,
    totalInPaise,
  } = useCartTotals();

  // Prefer local paint: only block empty-state while hydrate/sync is still pending.
  const cartLoading =
    items.length === 0 &&
    (authLoading ||
      !cartHydrated ||
      cartStatus === "syncing" ||
      cartStatus === "loading");

  useCartTaxEnrichment(items, {
    enabled: !cartLoading && items.length > 0,
  });

  const [email, setEmail] = useState("");
  const [guestStep, setGuestStep] = useState<GuestStep>("email");
  const [guestSessionToken, setGuestSessionToken] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<
    string | null
  >(null);
  const [saveAsDefault, setSaveAsDefault] = useState(false);

  const idempotencyKeyRef = useRef<string | null>(null);
  const addressesLoadedForUserRef = useRef<string | null>(null);

  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState<string | null>(null);
  const [prescriptionUploading, setPrescriptionUploading] = useState(false);
  const [prescriptionFileName, setPrescriptionFileName] = useState<string | null>(null);
  const prescriptionFileInputRef = useRef<HTMLInputElement | null>(null);

  async function handlePrescriptionFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError("Prescription image must be less than 10MB.");
      return;
    }

    setPrescriptionUploading(true);
    setPrescriptionFileName(file.name);
    try {
      const result = await checkoutService.uploadPrescription(file);
      setPrescriptionImageUrl(result.url);
      showSuccess("Prescription image uploaded successfully.");
    } catch {
      showError("Failed to upload prescription image. Please try again.");
      setPrescriptionFileName(null);
    } finally {
      setPrescriptionUploading(false);
    }
  }

  function handleRemovePrescription() {
    setPrescriptionImageUrl(null);
    setPrescriptionFileName(null);
    if (prescriptionFileInputRef.current) {
      prescriptionFileInputRef.current.value = "";
    }
  }

  function applySavedAddress(address: Address) {
    setSelectedSavedAddressId(address.id);
    setLine1(address.line1);
    setLine2(address.line2 ?? "");
    setCity(address.city);
    setState(isIndiaState(address.state) ? address.state : "");
    setPostalCode(address.postalCode);
    setSaveAsDefault(false);
  }

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
      if (user.firstName) setFirstName(user.firstName);
      if (user.lastName) setLastName(user.lastName);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setSavedAddresses([]);
      setSelectedSavedAddressId(null);
      setSaveAsDefault(false);
      addressesLoadedForUserRef.current = null;
      return;
    }
    if (addressesLoadedForUserRef.current === user.id) return;

    let cancelled = false;
    setAddressesLoading(true);
    void meService
      .listAddresses()
      .then((addresses) => {
        if (cancelled) return;
        addressesLoadedForUserRef.current = user.id;
        setSavedAddresses(addresses);
        const preferred =
          addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;
        if (preferred) {
          applySavedAddress(preferred);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSavedAddresses([]);
        }
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || isAuthenticated) return;
    const storedToken = sessionStorage.getItem(GUEST_TOKEN_KEY);
    const storedEmail = sessionStorage.getItem(GUEST_EMAIL_KEY);
    const storedVerified = sessionStorage.getItem(GUEST_VERIFIED_KEY) === "1";
    // Only restore a verified guest session when we have token + email from a
    // real verify-otp success. Never treat a bare token as verified (that skipped
    // OTP and left the email field empty).
    if (storedToken && storedEmail && storedVerified) {
      setGuestSessionToken(storedToken);
      setEmail(storedEmail);
      setGuestStep("verified");
    }
  }, [isAuthenticated]);

  if (cartLoading) {
    return (
      <div className="container-page section-space">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <div className="mt-8 space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-24 w-full max-w-md" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-page section-space text-center">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <p className="mt-3 text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-6">
          <Link href="/category">Browse products</Link>
        </Button>
      </div>
    );
  }

  const phoneDigitsForPay = normalizeIndianMobileDigits(phone);
  const canPay =
    !payBusy &&
    !authLoading &&
    !addressesLoading &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    line1.trim().length > 0 &&
    city.trim().length > 0 &&
    state.trim().length > 0 &&
    postalCode.trim().length > 0 &&
    phoneDigitsForPay.length === 10 &&
    (isAuthenticated || guestStep === "verified");

  const hasSavedAddresses = isAuthenticated && savedAddresses.length > 0;

  async function sendGuestOtp() {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      showError("Enter a valid email address.");
      return;
    }
    setOtpBusy(true);
    try {
      // Always bind the session to the email currently in the field. Reusing a
      // stale token (e.g. after changing email or restoring storage) can send
      // the OTP to a different inbox while this UI waits on the new address.
      const storedEmail = sessionStorage.getItem(GUEST_EMAIL_KEY);
      let token = guestSessionToken;
      if (!token || storedEmail !== normalized || guestStep === "email") {
        const session = await checkoutService.startGuestSession(normalized);
        token = session.sessionToken;
        setGuestSessionToken(token);
        sessionStorage.setItem(GUEST_TOKEN_KEY, token);
        sessionStorage.setItem(GUEST_EMAIL_KEY, normalized);
        sessionStorage.removeItem(GUEST_VERIFIED_KEY);
      }

      const result = await checkoutService.sendGuestOtp(token);
      setGuestStep("otp");
      if (result.resendAvailableAt) {
        showInfo("Please wait a moment before requesting another code.");
      } else {
        showInfo("Verification code sent to your email.");
      }
    } catch {
      showError("Could not send verification code. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function verifyGuestOtp() {
    if (!guestSessionToken || otp.length < 4) {
      showError("Enter the verification code.");
      return;
    }
    setOtpBusy(true);
    try {
      const verified = await checkoutService.verifyGuestOtp(
        guestSessionToken,
        otp,
      );
      setGuestStep("verified");
      setEmail(verified.email);
      sessionStorage.setItem(GUEST_TOKEN_KEY, guestSessionToken);
      sessionStorage.setItem(GUEST_EMAIL_KEY, verified.email);
      sessionStorage.setItem(GUEST_VERIFIED_KEY, "1");
      showSuccess("Email verified. You can complete payment.");
    } catch {
      showError("Invalid or expired code. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  function resetGuestEmailVerification() {
    setGuestStep("email");
    setGuestSessionToken(null);
    setOtp("");
    clearGuestCheckoutStorage();
    idempotencyKeyRef.current = null;
  }

  function ensureIdempotencyKey() {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createCheckoutIdempotencyKey();
    }
    return idempotencyKeyRef.current;
  }

  async function payNow() {
    if (!firstName.trim()) {
      showError("Please enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      showError("Please enter your last name.");
      return;
    }
    if (!line1.trim()) {
      showError("Please enter your delivery address.");
      return;
    }
    if (!city.trim()) {
      showError("Please enter your city.");
      return;
    }
    if (!state.trim()) {
      showError("Please select your state.");
      return;
    }
    if (!postalCode.trim()) {
      showError("Please enter your PIN code.");
      return;
    }
    const phoneDigits = normalizeIndianMobileDigits(phone);
    if (phoneDigits.length !== 10) {
      showError("Please enter a valid 10-digit mobile number.");
      return;
    }
    const formattedPhone = formatIndiaPhoneForCheckout(phoneDigits);

    if (!canPay) return;

    const missingVariant = items.some((item) => !item.variantId);
    if (missingVariant) {
      showError("Some cart items are missing variant information. Please re-add them.");
      return;
    }

    setPayBusy(true);
    try {
      const shippingAddress = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim() || undefined,
        postalCode: postalCode.trim(),
        country: DEFAULT_COUNTRY_CODE,
        phone: formattedPhone,
      };

      if (
        isAuthenticated &&
        saveAsDefault &&
        !hasSavedAddresses &&
        shippingAddress.state &&
        isIndiaState(shippingAddress.state)
      ) {
        try {
          const createdAddress = await meService.createAddress({
            label: "Home",
            line1: shippingAddress.line1,
            line2: shippingAddress.line2 ?? null,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: DEFAULT_COUNTRY_CODE,
            isDefault: true,
          });
          setSavedAddresses([createdAddress]);
          setSelectedSavedAddressId(createdAddress.id);
          setSaveAsDefault(false);
        } catch (err) {
          showError(
            toApiError(err).message ||
            "Could not save address. Continuing to payment…",
          );
        }
      }

      // Aggregate overall notes and per-item notes
      const perItemNotes = items
        .filter((item) => item.note?.trim())
        .map(
          (item) =>
            `[${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""}]: ${item.note!.trim()}`,
        );
      const combinedNotes = [extras.notes?.trim(), ...perItemNotes]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000);

      const created = await checkoutService.createPaymentOrder({
        items: items.map((item) => ({
          variantId: item.variantId!,
          quantity: item.quantity,
        })),
        shippingAddress,
        notes: combinedNotes || undefined,
        prescriptionImageUrl: prescriptionImageUrl || undefined,
        guestSessionToken: isAuthenticated ? undefined : guestSessionToken ?? undefined,
        idempotencyKey: ensureIdempotencyKey(),
      });

      if (created.confirmationToken) {
        sessionStorage.setItem(CONFIRMATION_TOKEN_KEY, created.confirmationToken);
      }

      await loadRazorpayCheckout();
      if (!window.Razorpay) {
        throw new Error("Razorpay unavailable");
      }

      const rzp = new window.Razorpay({
        key: created.keyId,
        amount: created.amountInPaise,
        currency: created.currency,
        name: "SkinDx Bioc",
        description: `Order ${created.orderNumber}`,
        order_id: created.razorpayOrderId,
        prefill: {
          email: isAuthenticated ? user?.email : email,
          name: [firstName, lastName].filter(Boolean).join(" ") || undefined,
          contact: formattedPhone,
        },
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const verified = await checkoutService.verifyPayment({
              orderId: created.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              guestSessionToken: isAuthenticated
                ? undefined
                : guestSessionToken ?? undefined,
            });

            if (verified.confirmationToken) {
              sessionStorage.setItem(
                CONFIRMATION_TOKEN_KEY,
                verified.confirmationToken,
              );
            }

            if (
              verified.paymentStatus === "CAPTURED" ||
              verified.orderStatus === "CONFIRMED"
            ) {
              void clearCartAction();
              clearGuestCheckoutStorage();
              idempotencyKeyRef.current = null;
              showSuccess("Payment successful.");
              const params = new URLSearchParams({ orderId: verified.orderId });
              if (verified.confirmationToken) {
                params.set("confirmationToken", verified.confirmationToken);
              }
              router.push(`/checkout/thank-you?${params.toString()}`);
            } else {
              showInfo("Payment is still processing. Checking status…");
              router.push(
                `/checkout/thank-you?orderId=${verified.orderId}${verified.confirmationToken
                  ? `&confirmationToken=${verified.confirmationToken}`
                  : ""
                }`,
              );
            }
          } catch {
            showError("Payment could not be confirmed. Checking status…");
            router.push(`/checkout/thank-you?orderId=${created.orderId}`);
          } finally {
            setPayBusy(false);
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              const status = await checkoutService.getPaymentStatus({
                orderId: created.orderId,
                guestSessionToken: isAuthenticated
                  ? undefined
                  : guestSessionToken ?? undefined,
              });
              if (status.paymentStatus === "CAPTURED") {
                void clearCartAction();
                showSuccess("Payment was already completed.");
                router.push(`/checkout/thank-you?orderId=${created.orderId}`);
              } else {
                showInfo("Payment cancelled. You can try again when ready.");
              }
            } catch {
              showInfo("Payment window closed.");
            } finally {
              setPayBusy(false);
            }
          },
        },
      });

      rzp.open();
    } catch {
      showError("Could not start payment. Please try again.");
      setPayBusy(false);
    }
  }

  return (
    <div className="grid min-h-[70vh] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="container-page max-w-2xl py-10 lg:ml-auto lg:mr-0 lg:px-10">
        <Link href="/" className=" text-sm">
          Home
        </Link>

        <div className="mt-10 space-y-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Contact</h2>
              {!isAuthenticated ? (
                <Link
                  href="/account/login?redirect=/checkout"
                  className="text-sm text-primary hover:underline"
                >
                  Sign in (optional)
                </Link>
              ) : (
                <span className="text-sm text-muted-foreground">Signed in</span>
              )}
            </div>

            {isAuthenticated ? (
              <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                {user?.email}
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="checkout-email">Email</Label>
                  <Input
                    id="checkout-email"
                    type="email"
                    value={email}
                    className={"mt-2"}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (guestStep !== "email") {
                        resetGuestEmailVerification();
                      }
                    }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={guestStep === "verified" || otpBusy}
                  />
                </div>

                {guestStep === "email" ? (
                  <Button
                    type="button"
                    onClick={() => void sendGuestOtp()}
                    disabled={otpBusy}
                  >
                    {otpBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Verify email to continue"
                    )}
                  </Button>
                ) : null}

                {guestStep === "otp" ? (
                  <div className="space-y-3">
                    <Label>Enter verification code</Label>
                    <InputOTP
                      maxLength={6}
                      pattern={REGEXP_ONLY_DIGITS}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void verifyGuestOtp()}
                        disabled={otpBusy || otp.length < 6}
                      >
                        Confirm code
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void sendGuestOtp()}
                        disabled={otpBusy}
                      >
                        Resend
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={resetGuestEmailVerification}
                        disabled={otpBusy}
                      >
                        Change email
                      </Button>
                    </div>
                  </div>
                ) : null}

                {guestStep === "verified" ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-green-700">
                      Email verified — continue to delivery and payment.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetGuestEmailVerification}
                    >
                      Change email
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* Prescription Upload Section (Optional) */}
          <section className="rounded-xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileImage className="size-5 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">Prescription</h2>
              </div>
              <span className="rounded-md border bg-muted px-2.5 py-0.5 text-sm font-medium text-black">
                Optional
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Have a doctor&apos;s prescription for your items? Upload a clear photo or scan (PNG, JPG, or WebP up to 10MB) for our verification team.
            </p>

            <input
              ref={prescriptionFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={(e) => void handlePrescriptionFileChange(e)}
              disabled={prescriptionUploading}
            />

            {!prescriptionImageUrl ? (
              <div
                onClick={() => {
                  if (!prescriptionUploading) {
                    prescriptionFileInputRef.current?.click();
                  }
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                  prescriptionUploading
                    ? "border-muted bg-muted/20 cursor-wait"
                    : "border-border/80 bg-muted/10 hover:border-primary/60 hover:bg-muted/30 cursor-pointer"
                }`}
              >
                {prescriptionUploading ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-foreground">
                      Uploading prescription to secure cloud…
                    </p>
                    <p className="text-xs text-muted-foreground">Please wait a moment</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="size-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Click to upload prescription image
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Supports PNG, JPG, or WEBP (up to 10MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-background shadow-xs">
                    <Image
                    height={250}
                    width={200}
                      src={prescriptionImageUrl}
                      alt="Prescription preview"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="size-3.5" />
                      Prescription uploaded
                    </div>
                    {prescriptionFileName && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-xs">
                        {prescriptionFileName}
                      </p>
                    )}
                    <a
                      href={prescriptionImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      View full image
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => prescriptionFileInputRef.current?.click()}
                    disabled={prescriptionUploading}
                    className="text-xs"
                  >
                    Change
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemovePrescription}
                    disabled={prescriptionUploading}
                    className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="size-3.5 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-border/80 bg-card p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">Delivery address</h2>
              </div>
              {isAuthenticated ? (
                <Link
                  href="/account/addresses"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Manage addresses
                </Link>
              ) : null}
            </div>

            {isAuthenticated && addressesLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading saved addresses…
              </p>
            ) : null}

            {hasSavedAddresses ? (
              <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Use a saved address
                </p>
                <ul className="space-y-2.5">
                  {savedAddresses.map((address) => {
                    const checked = selectedSavedAddressId === address.id;
                    return (
                      <li key={address.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/60 bg-background p-3 transition-colors hover:bg-muted/40">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              if (value === true) {
                                applySavedAddress(address);
                              } else if (checked) {
                                setSelectedSavedAddressId(null);
                              }
                            }}
                            aria-label={`Use ${address.label || "saved address"}`}
                            className="mt-0.5"
                          />
                          <span className="text-sm leading-snug">
                            <span className="font-medium text-foreground">
                              {address.label || "Address"}
                              {address.isDefault ? (
                                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                                  Default
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {address.line1}
                              {address.line2 ? `, ${address.line2}` : ""}
                              <br />
                              {address.city}, {address.state} {address.postalCode}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Check an address to fill the delivery form. You can still edit
                  the fields below before paying.
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Country / Region
                </Label>
                <Select value={DEFAULT_COUNTRY_CODE} disabled>
                  <SelectTrigger className="w-full bg-muted/40 font-medium">
                    <SelectValue placeholder="Country/Region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DEFAULT_COUNTRY_CODE}>India (IN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="checkout-first-name" className="mb-1.5 block text-xs font-medium">
                    First name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-first-name"
                    placeholder="e.g. John"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="checkout-last-name" className="mb-1.5 block text-xs font-medium">
                    Last name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-last-name"
                    placeholder="e.g. Doe"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="checkout-address-line1" className="mb-1.5 block text-xs font-medium">
                  Address line 1 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="checkout-address-line1"
                  placeholder="Street address, house number, area"
                  autoComplete="street-address"
                  required
                  value={line1}
                  onChange={(e) => {
                    setLine1(e.target.value);
                    setSelectedSavedAddressId(null);
                  }}
                />
              </div>

              <div>
                <Label htmlFor="checkout-address-line2" className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Apartment, suite, unit, building, floor (optional)
                </Label>
                <Input
                  id="checkout-address-line2"
                  placeholder="Apartment, suite, unit, floor, etc."
                  autoComplete="address-line2"
                  value={line2}
                  onChange={(e) => {
                    setLine2(e.target.value);
                    setSelectedSavedAddressId(null);
                  }}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="checkout-city" className="mb-1.5 block text-xs font-medium">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-city"
                    placeholder="e.g. Mumbai"
                    autoComplete="address-level2"
                    required
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      setSelectedSavedAddressId(null);
                    }}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium">
                    State <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={state || undefined}
                    onValueChange={(value) => {
                      setState(value);
                      setSelectedSavedAddressId(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIA_STATES.map((indiaState) => (
                        <SelectItem key={indiaState} value={indiaState}>
                          {indiaState}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="checkout-postal-code" className="mb-1.5 block text-xs font-medium">
                    PIN code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="checkout-postal-code"
                    placeholder="6-digit PIN code"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    required
                    value={postalCode}
                    onChange={(e) => {
                      setPostalCode(e.target.value);
                      setSelectedSavedAddressId(null);
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="checkout-phone" className="mb-1.5 block text-xs font-medium">
                    Phone number <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex">
                    <span
                      className="inline-flex shrink-0 items-center rounded-l-md border border-r-0 border-input bg-muted/50 px-3 text-sm font-medium text-muted-foreground"
                      aria-hidden
                    >
                      {INDIA_DIAL_CODE}
                    </span>
                    <Input
                      id="checkout-phone"
                      className="rounded-l-none"
                      placeholder="9857465658"
                      autoComplete="tel-national"
                      inputMode="numeric"
                      maxLength={10}
                      required
                      value={phone}
                      onChange={(e) =>
                        setPhone(normalizeIndianMobileDigits(e.target.value))
                      }
                      aria-describedby="checkout-phone-hint"
                    />
                  </div>
                  <p
                    id="checkout-phone-hint"
                    className="mt-1 text-[11px] text-muted-foreground"
                  >
                    Saved as {INDIA_DIAL_CODE} followed by your 10-digit number
                  </p>
                </div>
              </div>
            </div>

            {isAuthenticated && !hasSavedAddresses && !addressesLoading ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-border/80 bg-muted/20 p-3.5">
                <Checkbox
                  id="checkout-save-address"
                  checked={saveAsDefault}
                  onCheckedChange={(checked) =>
                    setSaveAsDefault(checked === true)
                  }
                  className="mt-0.5"
                />
                <Label
                  htmlFor="checkout-save-address"
                  className="text-xs leading-snug font-normal cursor-pointer"
                >
                  Save this address to my account as the default delivery address
                </Label>
              </div>
            ) : null}
          </section>

        </div>
      </div>

      <aside className="border-t border-border bg-muted/20 lg:border-t-0 lg:border-l">
        <div className="container-page max-w-lg py-8 lg:ml-0 lg:px-8 space-y-5">
          {/* Card 1: Order Products in Card Structure */}
          <div className="rounded-xl border border-border/80 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-foreground">
                Order summary
              </h2>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                {items.reduce((sum, item) => sum + item.quantity, 0) === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            <ul className="divide-y divide-border/60">
              {items.map((item) => {
                const pricing = getCartLinePricing(item);

                const isEditing = editingNoteItemId === item.id;

                return (
                  <li key={item.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-surface">
                        <Image
                          src={item.image || "https://placehold.co/64x64/png"}
                          alt={item.alt || item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {item.categoryName ? (
                          <p className="text-[11px] font-semibold tracking-[0.08em] text-primary uppercase">
                            {item.categoryName}
                          </p>
                        ) : null}
                        <p className="text-sm font-medium leading-snug text-foreground">
                          {item.name}
                        </p>
                        {item.productCode ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Code:{" "}
                            <span className="font-medium text-foreground">
                              {item.productCode}
                            </span>
                          </p>
                        ) : null}
                        {item.variantLabel ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.variantLabel}
                          </p>
                        ) : null}

                        <div className="mt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {formatPaiseToInr(pricing.payableUnitInPaise)}
                            <span className="ml-1 text-xs font-normal text-muted-foreground">
                              each
                            </span>
                          </span>
                          {!isVendor && pricing.hasDiscount ? (
                            <>
                              <span className="text-xs font-normal text-muted-foreground line-through">
                                {formatPaiseToInr(pricing.originalUnitInPaise)}
                              </span>
                              <span className="rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                                {pricing.discountPercent}% off
                                {item.discountCode ? ` · ${item.discountCode}` : ""}
                              </span>
                            </>
                          ) : !isVendor && item.discountCode ? (
                            <span className="rounded bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
                              {item.discountCode} applied
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => void remove(item.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pl-[4.75rem]">
                      <QuantityStepper
                        size="sm"
                        value={item.quantity}
                        onChange={(quantity) => void setQuantity(item.id, quantity)}
                      />

                      {/* <div className="w-full min-w-[11rem] space-y-1 rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-xs sm:w-auto sm:min-w-[12.5rem]">
                        <div className="flex justify-between gap-4 text-muted-foreground">
                          <span>
                            Amount × {item.quantity}
                          </span>
                          <span className="tabular-nums text-foreground">
                            {formatPaiseToInr(pricing.linePayableInPaise)}
                          </span>
                        </div>
                        {tax.cgstInPaise > 0 ? (
                          <div className="flex justify-between gap-4 text-muted-foreground">
                            <span>
                              CGST{cgstPercentLine > 0 ? ` (${cgstPercentLine}%)` : ""}
                            </span>
                            <span className="tabular-nums">
                              {formatPaiseToInr(tax.cgstInPaise)}
                            </span>
                          </div>
                        ) : null}
                        {tax.sgstInPaise > 0 ? (
                          <div className="flex justify-between gap-4 text-muted-foreground">
                            <span>
                              SGST{sgstPercentLine > 0 ? ` (${sgstPercentLine}%)` : ""}
                            </span>
                            <span className="tabular-nums">
                              {formatPaiseToInr(tax.sgstInPaise)}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex justify-between gap-4 border-t border-border/60 pt-1.5 text-sm font-semibold text-foreground">
                          <span>
                            {tax.taxInPaise > 0 ? "Total (incl. tax)" : "Line total"}
                          </span>
                          <span className="tabular-nums">
                            {formatPaiseToInr(lineInclTaxInPaise)}
                          </span>
                        </div>
                      </div> */}
                    </div>

                    <div className="">
                      {isEditing ? (
                        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <ClipboardList className="size-3.5 text-muted-foreground" />
                            <span>Item note</span>
                          </div>
                          <Textarea
                            value={itemNoteDraft}
                            onChange={(e) => setItemNoteDraft(e.target.value)}
                            placeholder="Add special instructions for this item…"
                            rows={2}
                            className="text-xs resize-none bg-background"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={cancelItemNote}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="xs"
                              onClick={() => saveItemNote(item.id)}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : item.note ? (
                        <div className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs">
                          <div className="flex items-start gap-1.5 min-w-0 flex-1">
                            <ClipboardList className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                            <p className="text-foreground/90 leading-snug break-words">
                              <span className="font-medium text-muted-foreground">Note: </span>
                              {item.note}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-[11px]">
                            <button
                              type="button"
                              onClick={() => startEditItemNote(item.id, item.note)}
                              className="text-muted-foreground hover:text-foreground underline underline-offset-2"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setItemNote(item.id, "")}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditItemNote(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ClipboardList className="size-3.5" />
                          <span>+ Add note</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 border-t border-border/60 pt-4">
              <Label
                htmlFor="checkout-order-notes"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Order notes
              </Label>
              <Textarea
                id="checkout-order-notes"
                value={extras.notes}
                onChange={(event) =>
                  dispatch(setCartNotes(event.target.value.slice(0, 2000)))
                }
                placeholder="Special instruction for seller…"
                rows={3}
                maxLength={2000}
                className="text-sm resize-none"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Included with your order when you pay
                {items.some((item) => item.note?.trim())
                  ? ", along with any item notes above"
                  : ""}
                .
              </p>
            </div>
          </div>

          {/* Card 2: Price summary breakdown in distinct white card */}
          <div className="rounded-xl border border-border/80 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment details
            </h3>
            <CartOrderSummaryRows
              className="space-y-2.5 text-sm"
              originalSubtotalInPaise={originalSubtotalInPaise}
              subtotalInPaise={subtotalInPaise}
              discountInPaise={discountInPaise}
              discountPercent={discountPercent}
              hideDiscount={isVendor}
              cgstInPaise={cgstInPaise}
              sgstInPaise={sgstInPaise}
              cgstPercent={cgstPercent}
              sgstPercent={sgstPercent}
              totalInPaise={totalInPaise}
              showShipping
            />
          </div>


          {/* Payment Section Card */}
          <section className="rounded-xl border border-border/80 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/60 pb-3">
              <ShieldCheck className="size-5 text-green-600" />
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground">
                  Payment
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pay securely with Razorpay. Cards, UPI, Netbanking & Wallets accepted.
                </p>
              </div>
            </div>

            <Button
              type="button"
              className="w-full h-12 py-3.5 text-base font-semibold shadow-md shadow-primary/10 hover:shadow-lg transition-all"
              size="lg"
              disabled={!canPay}
              onClick={() => void payNow()}
            >
              {payBusy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Preparing payment…
                </span>
              ) : (
                `Pay now · ${formatPaiseToInr(totalInPaise)}`
              )}
            </Button>
            <p className="text-center pt-1 text-xs text-muted-foreground">
              <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
              >
                <ShoppingCart className="size-5"/>
                Return to cart
              </Link>
            </p>
          </section>

        </div>
      </aside>
    </div>
  );
}
