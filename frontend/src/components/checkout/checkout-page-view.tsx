"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Loader2, Trash2 } from "lucide-react";

import { CartLinePrice, getCartLinePricing } from "@/components/cart/cart-line-price";
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
import { checkoutService } from "@/features/checkout/checkout.service";
import type { RazorpaySuccessResponse } from "@/features/checkout/checkout.types";
import {
  createCheckoutIdempotencyKey,
  loadRazorpayCheckout,
} from "@/features/checkout/load-razorpay";
import { meService } from "@/features/me/me.service";
import type { Address } from "@/features/me/me.types";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAuth } from "@/hooks/useAuth";
import { useCartActions } from "@/hooks/useCartActions";
import { useCartTotals } from "@/hooks/useCartTotals";
import { showError, showInfo, showSuccess } from "@/lib/toast";
import { formatPaiseToInr } from "@/lib/utils";
import {
  DEFAULT_COUNTRY_CODE,
  INDIA_STATES,
  isIndiaState,
} from "@/utils/states";
import { toApiError } from "@/services/api/errors";

const GUEST_TOKEN_KEY = "skindx_guest_checkout_token";
const CONFIRMATION_TOKEN_KEY = "skindx_order_confirmation_token";

type GuestStep = "email" | "otp" | "verified";

export function CheckoutPageView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { setQuantity, remove, clear: clearCartAction } = useCartActions();
  const {
    items,
    extras,
    originalSubtotalInPaise,
    discountInPaise,
    discountPercent,
    totalInPaise,
  } = useCartTotals();

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
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(GUEST_TOKEN_KEY);
    if (stored && !isAuthenticated) {
      setGuestSessionToken(stored);
      setGuestStep("verified");
    }
  }, [isAuthenticated]);

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

  const canPay =
    !payBusy &&
    !authLoading &&
    !addressesLoading &&
    lastName.trim() &&
    line1.trim() &&
    city.trim() &&
    state.trim() &&
    postalCode.trim() &&
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
      let token = guestSessionToken;
      if (!token) {
        const session = await checkoutService.startGuestSession(normalized);
        token = session.sessionToken;
        setGuestSessionToken(token);
        sessionStorage.setItem(GUEST_TOKEN_KEY, token);
      }
      await checkoutService.sendGuestOtp(token);
      setGuestStep("otp");
      showInfo("Verification code sent to your email.");
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
      await checkoutService.verifyGuestOtp(guestSessionToken, otp);
      setGuestStep("verified");
      showSuccess("Email verified. You can complete payment.");
    } catch {
      showError("Invalid or expired code. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  }

  function ensureIdempotencyKey() {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = createCheckoutIdempotencyKey();
    }
    return idempotencyKeyRef.current;
  }

  async function payNow() {
    if (!canPay) return;

    const missingVariant = items.some((item) => !item.variantId);
    if (missingVariant) {
      showError("Some cart items are missing variant information. Please re-add them.");
      return;
    }

    setPayBusy(true);
    try {
      const shippingAddress = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim(),
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim() || undefined,
        postalCode: postalCode.trim(),
        country: DEFAULT_COUNTRY_CODE,
        phone: phone.trim() || undefined,
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

      const created = await checkoutService.createPaymentOrder({
        items: items.map((item) => ({
          variantId: item.variantId!,
          quantity: item.quantity,
        })),
        shippingAddress,
        notes: extras.notes || undefined,
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
          contact: phone || undefined,
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
              sessionStorage.removeItem(GUEST_TOKEN_KEY);
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
                `/checkout/thank-you?orderId=${verified.orderId}${
                  verified.confirmationToken
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
        <Link href="/" className="font-display text-2xl font-semibold">
          SkinDx
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (guestStep !== "email") {
                        setGuestStep("email");
                        setGuestSessionToken(null);
                        sessionStorage.removeItem(GUEST_TOKEN_KEY);
                        idempotencyKeyRef.current = null;
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
                    </div>
                  </div>
                ) : null}

                {guestStep === "verified" ? (
                  <p className="text-sm font-medium text-green-700">
                    Email verified — continue to delivery and payment.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Delivery</h2>
              {isAuthenticated ? (
                <Link
                  href="/account/addresses"
                  className="text-sm text-primary hover:underline"
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
              <div className="space-y-3 rounded-lg border border-border p-4">
                <p className="text-sm font-medium">Use a saved address</p>
                <ul className="space-y-3">
                  {savedAddresses.map((address) => {
                    const checked = selectedSavedAddressId === address.id;
                    return (
                      <li key={address.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-md p-1 hover:bg-muted/50">
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
                          />
                          <span className="text-sm leading-snug">
                            <span className="font-medium">
                              {address.label || "Address"}
                              {address.isDefault ? (
                                <span className="ml-2 text-xs font-medium text-primary">
                                  Default
                                </span>
                              ) : null}
                            </span>
                            <span className="mt-0.5 block text-muted-foreground">
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

            <Select value={DEFAULT_COUNTRY_CODE} disabled>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Country/Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_COUNTRY_CODE}>India</SelectItem>
              </SelectContent>
            </Select>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="First name"
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <Input
                placeholder="Last name"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <Input
              placeholder="Address"
              autoComplete="street-address"
              required
              value={line1}
              onChange={(e) => {
                setLine1(e.target.value);
                setSelectedSavedAddressId(null);
              }}
            />
            <Input
              placeholder="Apartment, suite, etc. (optional)"
              autoComplete="address-line2"
              value={line2}
              onChange={(e) => {
                setLine2(e.target.value);
                setSelectedSavedAddressId(null);
              }}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="City"
                autoComplete="address-level2"
                required
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setSelectedSavedAddressId(null);
                }}
              />
              <Select
                value={state || undefined}
                onValueChange={(value) => {
                  setState(value);
                  setSelectedSavedAddressId(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="State" />
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="PIN code"
                autoComplete="postal-code"
                inputMode="numeric"
                required
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  setSelectedSavedAddressId(null);
                }}
              />
              <Input
                placeholder="Phone (optional)"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {isAuthenticated && !hasSavedAddresses && !addressesLoading ? (
              <div className="flex items-start gap-2 rounded-md border border-border p-3">
                <Checkbox
                  id="checkout-save-address"
                  checked={saveAsDefault}
                  onCheckedChange={(checked) =>
                    setSaveAsDefault(checked === true)
                  }
                />
                <Label
                  htmlFor="checkout-save-address"
                  className="text-sm leading-snug font-normal"
                >
                  Save this address to my account as the default delivery
                  address
                </Label>
              </div>
            ) : null}
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Payment</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay securely with Razorpay. Your order is confirmed only after
                our servers verify the payment.
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
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
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/cart" className="underline-offset-4 hover:underline">
                Return to cart
              </Link>
            </p>
          </section>
        </div>
      </div>

      <aside className="border-t border-border bg-surface lg:border-t-0 lg:border-l">
        <div className="container-page max-w-md py-10 lg:ml-0 lg:px-10">
          <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
            Order summary
          </h2>
          <ul className="space-y-5">
            {items.map((item) => {
              const pricing = getCartLinePricing(item);
              return (
                <li key={item.id} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-border bg-background">
                      <Image
                        src={item.image || "https://placehold.co/64x64/png"}
                        alt={item.alt || item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.variantLabel ? (
                        <p className="text-xs text-muted-foreground">
                          {item.variantLabel}
                        </p>
                      ) : null}
                      {pricing.hasDiscount ? (
                        <p className="mt-0.5 text-[11px] font-medium text-green-700">
                          {pricing.discountPercent}% off
                          {item.discountCode ? ` · ${item.discountCode}` : ""}
                        </p>
                      ) : null}
                      <CartLinePrice
                        item={item}
                        mode="unit"
                        compact
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => void remove(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between gap-3 pl-[4.75rem]">
                    <QuantityStepper
                      size="sm"
                      value={item.quantity}
                      onChange={(quantity) => void setQuantity(item.id, quantity)}
                    />
                    <CartLinePrice item={item} mode="line" compact />
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatPaiseToInr(originalSubtotalInPaise)}</span>
            </div>
            {discountInPaise > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount ({discountPercent}%)</span>
                <span>-{formatPaiseToInr(discountInPaise)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatPaiseToInr(totalInPaise)}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
