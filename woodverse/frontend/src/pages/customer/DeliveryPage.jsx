import { useState } from "react";
import { navigate } from "../../utils";
import { CheckoutHero, OrderSummary, Panel } from "./CartPage";

const initial = () => { try { return JSON.parse(localStorage.getItem("woodverse-shipping-address")||"{}"); } catch { return {}; } };
export function DeliveryPage({cart=[]}) {
 const [address,setAddress]=useState(initial);
 const subtotal=cart.reduce((sum,item)=>sum+Number(item.price||0)*(item.quantity||1),0);
 const update=(key,value)=>setAddress(prev=>({...prev,[key]:value}));
 const valid=["fullName","phone","street","district"].every(k=>String(address[k]||"").trim());
 const proceed=()=>{if(!valid)return;localStorage.setItem("woodverse-shipping-address",JSON.stringify(address));navigate("/payment");};
 return <><CheckoutHero title="Delivery Details" subtitle="Provide the address for your furniture delivery." active="Delivery" back="/cart"/>
 <section className="page-shell grid grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-8 pb-16 max-lg:grid-cols-1">
 <Panel title="Shipping Address" subtitle="Required to place an order."><div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">{[["fullName","Full name"],["phone","Phone number"],["street","Street address"],["district","District"]].map(([key,label])=><label key={key} className="grid gap-2 font-semibold">{label}<input value={address[key]||""} onChange={e=>update(key,e.target.value)} required className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-[#1d2422]" /></label>)}</div></Panel>
 <OrderSummary subtotal={subtotal} cta="Continue to order review" onAction={proceed} disabled={!valid}/>
 </section></>;
}
export function CheckoutGrid({payment=false}) { return payment?<p className="text-sm text-slate-500">Payment processing is not yet integrated in this prototype.</p>:null; }
