import { useState } from "react";
import {
  CreditCard,
} from "lucide-react";
import { apiRequest, formatPrice, DELIVERY_FEE, ASSURANCE_FEE } from "../../utils";

import { CheckoutHero, OrderSummary, Panel } from "./CartPage";


export function PaymentPage({ cart = [], setCart, catalogItems = [] }) {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isPlacing, setIsPlacing] = useState(false);
  const orderItems = cart;
  // Display figures only. The amount that is charged comes back from the server, which
  // prices the order from the products table. There is no hardcoded fallback total:
  // the old `|| 357500` invented a price for an empty cart.
  const subtotal = orderItems.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);
  const delivery = orderItems.length ? DELIVERY_FEE : 0;
  const assurance = orderItems.length ? ASSURANCE_FEE : 0;
  const total = subtotal + delivery + assurance;
  const [confirmed, setConfirmed] = useState(null);

  const placeOrder = async () => {
    setError("");
    setNotice("");
    setIsPlacing(true);
    try {
      const result = await apiRequest("/api/orders", {
        method: "POST",
        // Only product ids and quantities. The server decides who the customer is,
        // what each item costs, and whether stock is available.
        body: JSON.stringify({
          items: orderItems.map((item) => ({ id: item.databaseId || item.id, quantity: item.quantity || 1 })),\n          shippingAddress: JSON.parse(localStorage.getItem("woodverse-shipping-address") || "{}"),
        }),
      });
      setConfirmed(result);
      setCart?.([]);
      setNotice(result.requiresVendorApproval
        ? `Order ${result.order.reference || result.order.id} placed. It is waiting for vendor approval before production tracking.`
        : `Order ${result.order.reference || result.order.id} placed. Stock is available, so the vendor can fulfill it without manufacturing.`);
    } catch (requestError) {
      setError(requestError.message || "We could not place your order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <>
      <CheckoutHero title="Review Order" subtitle="Review your order. Payment processing is not integrated in this prototype." active="Payment" back="/delivery" />
      <section className="page-shell grid grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-8 pb-16 max-lg:grid-cols-1">
        <div className="grid gap-6"><Panel title="Payment" subtitle="No card details are collected. This creates an order only; it does not charge you."><p className="text-sm text-slate-500">Payment gateway integration is pending. Do not use this prototype for real purchases.</p></Panel></div>
        <OrderSummary
          subtotal={subtotal}
          cta={isPlacing ? "Placing order..." : confirmed ? "Order placed" : `Place order · ${formatPrice(total)}`}
          onAction={placeOrder}
          notice={notice}
          error={error}
          disabled={isPlacing || Boolean(confirmed) || orderItems.length === 0}
        />
        {confirmed?.pricing && (
          <p className="text-sm text-slate-500 dark:text-stone-400">
            Charged amount confirmed by the server: {formatPrice(confirmed.pricing.total)}
          </p>
        )}
      </section>
    </>
  );
}

export function PaymentOptions() {
  return <div className="grid gap-3">{["Credit or debit card", "Bank transfer", "Cash on delivery deposit"].map((item, index) => <label key={item} className="flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 leading-snug dark:border-slate-700 dark:bg-[#1d2422]"><input type="radio" name="payment" defaultChecked={index === 0} className="mt-1 shrink-0 accent-forest" /><CreditCard className="h-5 w-5 shrink-0 text-forest" /><span className="min-w-0 break-words">{item}</span></label>)}</div>;
}
