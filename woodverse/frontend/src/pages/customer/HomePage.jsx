import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Facebook,
  Factory,
  Instagram,
  Linkedin,
  Home,
  Mail,
  Menu,
  MapPin,
  MessageSquare,
  PackageCheck,
  Phone,
  Play,
  Quote,
  Search,
  Send,
  Star,
  ShoppingCart,
  Store,
  Sun,
  Truck,
  Warehouse,
  UserRound,
  Users,
  X,
  Zap,
} from "lucide-react";
import { navigate } from "../../utils";
import { SectionHeading } from "../../components/LayoutParts";
import { ProductCard } from "../../components/ProductCard";
import { TestimonialMarquee } from "../../components/TestimonialMarquee";
import { vendors } from "../../data/catalog";

export function HomePage({ addToCart }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePreview, setActivePreview] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [contactSent, setContactSent] = useState(false);
  const previewImages = [
    ["/assets/home-hero.png", "Customer marketplace", "Browse verified products and place orders."],
    ["/assets/furniture-hero.png", "Vendor workspace", "Manage production, stock, and customer orders."],
    ["/assets/material-teak-log.png", "Supplier network", "Keep material availability connected to production."],
  ];
  const faqs = [
    ["What is WoodVerse?", "WoodVerse is a connected platform for customers, furniture vendors, and material suppliers. Customers shop and track orders, vendors manage fulfillment and production, and suppliers support the material flow."],
    ["Can vendors manufacture out-of-stock products?", "Yes. When an order needs manufacturing, the vendor reviews and approves it before a production work order is created and tracked."],
    ["How are vendors and suppliers verified?", "They submit business and compliance documents. Admin reviews the application and either approves it or requests corrections before portal access is granted."],
    ["Can I track my order?", "Customers can follow order status, vendor approval, production tracking, shipment progress, and delivery from the customer workflow."],
    ["Which plans are available?", "The public marketplace is available to customers. Vendors and suppliers can start with the Starter plan and scale into Pro or Enterprise operations."],
  ];
  const scrollTo = (id) => {
    setMobileMenuOpen(false);
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };
  const homeLinks = [
    ["Home", "#top"],
    ["Features", "#features"],
    ["About", "#about"],
    ["Services", "#services"],
    ["How It Works", "#how-it-works"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
    ["Contact", "#contact"],
  ];

  return (
    <main className="overflow-hidden bg-[#f7f8f5] text-[#17231f] dark:bg-[#101714] dark:text-stone-100">
      <nav className="sticky top-0 z-40 border-b border-white/20 bg-[#102f27]/90 text-white shadow-lg backdrop-blur-xl">
        <div className="page-shell flex min-h-20 items-center justify-between gap-6">
          <button onClick={() => scrollTo("#top")} className="flex items-center gap-3 text-left" aria-label="WoodVerse home">
            <img src="/assets/woodverse-logo.png" alt="WoodVerse" className="h-11 w-11 rounded-lg object-cover" />
            <span><strong className="block text-lg font-extrabold tracking-wide">WoodVerse</strong><small className="block text-xs text-emerald-100/70">Craft. Connect. Grow.</small></span>
          </button>
          <div className={`${mobileMenuOpen ? "absolute left-4 right-4 top-[76px] grid rounded-xl border border-white/10 bg-[#102f27] p-4 shadow-2xl" : "hidden"} items-center gap-1 lg:static lg:flex lg:bg-transparent lg:p-0 lg:shadow-none`}>
            {homeLinks.map(([item, target]) => <button key={item} onClick={() => target.startsWith("#") ? scrollTo(target) : navigate(target)} className="rounded-lg px-3 py-2 text-left text-sm font-bold text-emerald-50/80 transition hover:bg-white/10 hover:text-white">{item}</button>)}
            <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 lg:ml-3 lg:mt-0 lg:flex lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <button onClick={() => navigate("/login")} className="rounded-lg px-4 py-2 text-sm font-extrabold text-white hover:bg-white/10">Login</button>
              <button onClick={() => navigate("/login")} className="rounded-lg bg-[#d8a36b] px-4 py-2 text-sm font-extrabold text-[#17231f] shadow-md transition hover:bg-[#e4b57e]">Get it free</button>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-lg bg-white/10 lg:hidden" aria-label="Toggle navigation">{mobileMenuOpen ? <X /> : <Menu />}</button>
        </div>
      </nav>

      <section id="top" className="relative isolate min-h-[720px] overflow-hidden bg-[#102f27] text-white">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(16,47,39,.98)_0%,rgba(16,47,39,.86)_40%,rgba(16,47,39,.36)_100%),url('/assets/site-hero.png')] bg-cover bg-center" />
        <div className="page-shell grid min-h-[720px] items-center gap-12 py-20 lg:grid-cols-[minmax(0,1fr)_500px]">
          <div className="max-w-2xl animate-[fadeUp_.7s_ease-out]">
            <span className="inline-flex rounded-full border border-emerald-200/30 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.18em] text-emerald-100 backdrop-blur">The connected woodcraft platform</span>
            <h1 className="mt-7 break-words text-5xl font-extrabold leading-[1.04] sm:text-6xl lg:text-7xl">Build better woodcraft, together.</h1>
            <p className="mt-6 max-w-xl break-words text-lg leading-relaxed text-emerald-50/80 sm:text-xl">WoodVerse brings customers, verified vendors, and trusted suppliers into one place, from the first product search to final delivery.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => navigate("/shop")} className="inline-flex min-h-14 items-center gap-3 rounded-xl bg-[#d8a36b] px-7 text-lg sm:min-h-16 sm:px-9 font-extrabold text-[#17231f] shadow-xl transition hover:-translate-y-1 hover:bg-[#e4b57e]">Get it free <ArrowRight className="h-6 w-6" /></button>
              <button onClick={() => scrollTo("#about")} className="inline-flex min-h-14 items-center gap-3 rounded-xl border border-white/25 bg-white/10 px-7 text-lg sm:min-h-16 sm:px-9 font-extrabold text-white backdrop-blur transition hover:bg-white/15"><Play className="h-5 w-5 fill-current" /> Learn More</button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3 shadow-2xl backdrop-blur-xl animate-[float_6s_ease-in-out_infinite]">
            <div className="overflow-hidden rounded-xl bg-[#f5f7f2] text-[#17231f] shadow-inner dark:bg-[#1b2823] dark:text-stone-100">
              <div className="flex items-center justify-between border-b border-[#dce5df] px-5 py-4 dark:border-white/10"><span className="flex items-center gap-2 text-sm font-extrabold"><span className="h-2.5 w-2.5 rounded-full bg-[#d8a36b]" /> WoodVerse workspace</span><span className="rounded-full bg-[#dceee2] px-2 py-1 text-[10px] font-extrabold uppercase text-[#25634f]">Live</span></div>
              <div className="grid gap-4 p-5"><div className="grid grid-cols-3 gap-3">{[["Orders", "248", "+18%"], ["In production", "36", "On track"], ["Suppliers", "42", "Verified"]].map(([label, value, note]) => <div key={label} className="rounded-lg bg-white p-3 shadow-sm dark:bg-[#24332d]"><span className="block text-[10px] font-extrabold uppercase text-[#718078]">{label}</span><strong className="mt-2 block text-2xl">{value}</strong><span className="text-[11px] font-bold text-[#3b8868]">{note}</span></div>)}</div><div className="grid grid-cols-[1.2fr_.8fr] gap-4"><div className="rounded-lg bg-white p-4 shadow-sm dark:bg-[#24332d]"><div className="flex items-center justify-between"><strong className="text-sm">Fulfillment overview</strong><BarChart3 className="h-4 w-4 text-[#3b8868]" /></div><div className="mt-6 flex h-28 items-end gap-2">{[42, 58, 49, 76, 64, 88, 72].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[#5fa383]" style={{ height: `${height}%`, opacity: index === 5 ? 1 : .55 }} />)}</div><div className="mt-3 flex justify-between text-[10px] font-bold text-[#718078]"><span>Mon</span><span>Sun</span></div></div><div className="grid content-between rounded-lg bg-[#dbeee3] p-4 text-[#245f4d] dark:bg-[#29443a] dark:text-emerald-100"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/70"><PackageCheck className="h-5 w-5" /></span><span><strong className="block text-3xl">96.8%</strong><small className="text-xs font-bold">on-time delivery</small></span></div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-24 page-shell grid gap-12 py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div><span className="eyebrow">About WoodVerse</span><h2 className="text-4xl font-extrabold leading-tight sm:text-5xl">A better way to move ideas from timber to home.</h2><p className="mt-5 text-lg leading-relaxed text-[#5b6b64] dark:text-stone-300">We are building the operating layer for modern woodcraft. Customers discover honest products, vendors get the tools to fulfill and manufacture confidently, and suppliers know exactly where materials are needed.</p><button onClick={() => navigate("/shop")} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#1c614f] px-5 font-extrabold text-white shadow-lg transition hover:-translate-y-1">Explore the marketplace <ArrowRight className="h-4 w-4" /></button></div>
        <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-white/80 bg-white/70 p-6 shadow-xl shadow-[#183e3320] backdrop-blur dark:border-white/10 dark:bg-white/5"><Zap className="h-7 w-7 text-[#c98e53]" /><h3 className="mt-5 text-xl font-extrabold">Mission</h3><p className="mt-2 leading-relaxed text-[#5b6b64] dark:text-stone-300">Make sustainable, locally crafted furniture easier to discover, produce, and deliver.</p></article><article className="mt-8 rounded-2xl border border-white/80 bg-[#e1eee5] p-6 shadow-xl shadow-[#183e3320] dark:border-white/10 dark:bg-[#1e342b]"><Users className="h-7 w-7 text-[#1c614f] dark:text-emerald-200" /><h3 className="mt-5 text-xl font-extrabold">Vision</h3><p className="mt-2 leading-relaxed text-[#5b6b64] dark:text-stone-300">A transparent woodcraft ecosystem where every partner can grow with confidence.</p></article></div>
      </section>

      <section id="services" className="scroll-mt-24 border-y border-[#dce5df] bg-white py-20 dark:border-white/10 dark:bg-[#101714]"><div className="page-shell"><SectionHeading title="One platform for customers" subtitle="Browse woodcraft products, track orders, and move from discovery to delivery in one connected flow." /><div className="grid gap-5 lg:grid-cols-1">{[[UserRound, "Customers", "Discover verified furniture, place orders, and follow every step through production and delivery.", "/shop", "Browse marketplace"]].map(([Icon, title, detail, href, action]) => <article key={title} className="group grid gap-5 rounded-2xl border border-[#dce5df] bg-[#f7f8f5] p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#dbeee3] text-[#1c614f] transition group-hover:bg-[#1c614f] group-hover:text-white dark:bg-[#29483b] dark:text-emerald-100"><Icon className="h-6 w-6" /></span><div><h3 className="text-xl font-extrabold">{title}</h3><p className="mt-3 text-sm leading-relaxed text-[#65736c] dark:text-stone-300">{detail}</p></div><button onClick={() => navigate(href)} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-[#1c614f] px-4 text-sm font-extrabold text-white">{action}<ArrowRight className="h-4 w-4" /></button></article>)}</div></div></section>
      <section id="features" className="scroll-mt-24 bg-[#edf3ee] py-24 dark:bg-[#14221d]"><div className="page-shell"><SectionHeading title="Everything your operation needs" subtitle="One calm workspace for commerce, coordination, and growth." /><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[[ShoppingCart, "Customer marketplace", "Discover verified furniture, compare products, and order with confidence."], [Store, "Vendor operations", "Manage catalog, quotations, customer orders, and vendor approvals."], [Warehouse, "Supplier network", "Connect available timber and materials to real production demand."], [PackageCheck, "Order fulfillment", "Move every order from stock decision to shipment and delivery."], [Factory, "Production tracking", "Create work orders only when manufacturing is needed and approved."], [ShieldIcon, "Document verification", "Keep vendor and supplier registration documents in one review flow."], [BarChart3, "Business insights", "See sales, inventory, delivery, and supplier performance clearly."], [MessageSquare, "Real-time communication", "Keep customers, vendors, and suppliers aligned with live updates."]].map(([Icon, title, detail]) => <article key={title} className="group rounded-2xl border border-white/80 bg-white/80 p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl dark:border-white/10 dark:bg-white/5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#dbeee3] text-[#1c614f] transition group-hover:bg-[#1c614f] group-hover:text-white dark:bg-[#28483b] dark:text-emerald-100"><Icon className="h-6 w-6" /></span><h3 className="mt-5 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#65736c] dark:text-stone-300">{detail}</p></article>)}</div></div></section>

      <section className="bg-[#edf3ee] py-20 dark:bg-[#14221d]">
        <div className="page-shell">
          <SectionHeading title="Why teams choose WoodVerse" subtitle="A sharper workflow for discovery, production, and delivery." />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[[ShoppingCart, "Marketplace", "Browse verified furniture and gifts with clear product context."], [Store, "Vendor tools", "Keep pricing, stock, and customer orders in one workspace."], [Factory, "Production flow", "Turn approved orders into manufacturing work with visible status."], [ShieldIcon, "Trust & control", "Keep documents, verification, and order communication neatly aligned."]].map(([Icon, title, detail]) => (
              <article key={title} className="rounded-2xl border border-white/80 bg-white/80 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#dbeee3] text-[#1c614f] dark:bg-[#28483b] dark:text-emerald-100"><Icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#65736c] dark:text-stone-300">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="page-shell py-24"><SectionHeading title="How WoodVerse works" subtitle="A simple flow that keeps every handoff visible." /><div className="relative grid gap-8 md:grid-cols-4">{[[Search, "1", "Discover", "Customers find the right product or material."], [ClipboardList, "2", "Coordinate", "Vendors review stock and supplier availability."], [Factory, "3", "Create", "Approved manufacturing work becomes production tracking."], [Truck, "4", "Deliver", "Shipments move to the customer with clear status updates."]].map(([Icon, number, title, detail]) => <article key={number} className="group relative text-center"><span className="absolute left-1/2 top-7 hidden h-px w-full bg-[#bdd6c7] md:block" style={{ transform: "translateX(50%)" }} /><span className="relative z-10 mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#1c614f] text-white shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-xl"><Icon className="h-7 w-7" /></span><span className="absolute left-1/2 top-[-1.25rem] z-20 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full bg-[#dbeee3] text-sm font-black text-[#1c614f] shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:bg-[#d8a36b] dark:bg-[#29463a] dark:text-emerald-100">{number}</span><h3 className="relative mt-5 text-xl font-extrabold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#65736c] dark:text-stone-300">{detail}</p></article>)}</div></section>

      <section className="bg-[#102f27] py-20 text-white"><div className="page-shell grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{[[2400, "+", "Orders fulfilled", "from first click to delivery"], [184, "", "Verified vendors", "crafting across Sri Lanka"], [42, "", "Material suppliers", "supporting production demand"], [96.8, "%", "On-time delivery", "across active shipments"]].map(([value, suffix, label, detail]) => <article key={label} className="border-l border-white/20 pl-5"><AnimatedStat value={value} suffix={suffix} /><h3 className="mt-2 font-extrabold">{label}</h3><p className="mt-1 text-sm text-emerald-100/65">{detail}</p></article>)}</div></section>

      <section id="preview" className="page-shell py-24"><SectionHeading title="See the platform in action" subtitle="Purpose-built screens for every part of the woodcraft workflow." /><div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><div className="overflow-hidden rounded-2xl border border-[#dce5df] bg-[#102f27] p-3 shadow-2xl dark:border-white/10"><img src={previewImages[activePreview][0]} alt={previewImages[activePreview][1]} className="h-[420px] w-full rounded-xl object-cover transition duration-500" /></div><div className="grid content-center gap-3">{previewImages.map(([image, title, detail], index) => <button key={title} onClick={() => setActivePreview(index)} className={`grid grid-cols-[72px_minmax(0,1fr)] items-center gap-4 rounded-xl p-3 text-left transition ${activePreview === index ? "bg-[#dbeee3] dark:bg-[#29483b]" : "hover:bg-white dark:hover:bg-white/5"}`}><img src={image} alt="" className="h-16 w-16 rounded-lg object-cover" /><span><strong className="block font-extrabold">{title}</strong><small className="mt-1 block leading-relaxed text-[#65736c] dark:text-stone-300">{detail}</small></span></button>)}</div></div></section>

      <TestimonialMarquee />

      <section id="pricing" className="page-shell py-24"><SectionHeading title="Plans that grow with your operation" subtitle="Start with the tools you need today and scale when you are ready." /><div className="grid gap-5 lg:grid-cols-3">{[["Free", "LKR 0", "For exploring WoodVerse", ["Customer marketplace", "Order tracking", "Basic support"], false], ["Pro", "LKR 9,900", "For growing vendors and suppliers", ["Everything in Free", "Production tracking", "Document verification", "Real-time collaboration"], true], ["Enterprise", "Let's talk", "For multi-site operations", ["Everything in Pro", "Advanced analytics", "Priority support", "Custom workflows"], false]].map(([name, price, detail, points, featured]) => <article key={name} className={`relative rounded-2xl border p-7 shadow-sm ${featured ? "border-[#1c614f] bg-[#1c614f] text-white shadow-xl lg:-translate-y-3" : "border-[#dce5df] bg-white dark:border-white/10 dark:bg-white/5"}`}>{featured && <span className="absolute -top-3 left-6 rounded-full bg-[#d8a36b] px-3 py-1 text-xs font-extrabold uppercase text-[#17231f]">Recommended</span>}<h3 className="text-xl font-extrabold">{name}</h3><p className={`mt-2 text-sm ${featured ? "text-emerald-50/70" : "text-[#718078] dark:text-stone-300"}`}>{detail}</p><strong className="mt-6 block text-4xl">{price}<small className="text-sm font-bold">{name === "Pro" ? "/month" : ""}</small></strong><ul className="mt-6 grid gap-3">{points.map((point) => <li key={point} className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#d8a36b]" />{point}</li>)}</ul><button onClick={() => navigate("/login")} className={`mt-8 min-h-12 w-full rounded-lg font-extrabold ${featured ? "bg-white text-[#1c614f]" : "bg-[#1c614f] text-white"}`}>{name === "Enterprise" ? "Contact Sales" : "Get Started"}</button></article>)}</div></section>

      <section id="faq" className="bg-[#edf3ee] py-24 dark:bg-[#14221d]"><div className="page-shell grid gap-12 lg:grid-cols-[.7fr_1.3fr]"><div><span className="eyebrow">FAQ</span><h2 className="text-4xl font-extrabold leading-tight">Questions, answered clearly.</h2><p className="mt-4 leading-relaxed text-[#65736c] dark:text-stone-300">Still curious about how the connected workflow works? We keep the answers practical.</p></div><div className="grid gap-3">{faqs.map(([question, answer], index) => <article key={question} className="rounded-xl border border-white/80 bg-white/80 dark:border-white/10 dark:bg-white/5"><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} className="flex min-h-16 w-full items-center justify-between gap-4 px-5 text-left font-extrabold">{question}<ChevronRight className={`h-5 w-5 shrink-0 transition-transform ${openFaq === index ? "rotate-90" : ""}`} /></button>{openFaq === index && <p className="border-t border-[#dce5df] px-5 py-4 text-sm leading-relaxed text-[#65736c] dark:border-white/10 dark:text-stone-300">{answer}</p>}</article>)}</div></div></section>

      <section id="contact" className="page-shell grid gap-10 py-24 lg:grid-cols-[1fr_1.15fr]"><div><span className="eyebrow">Contact</span><h2 className="text-4xl font-extrabold leading-tight">Let’s build a better woodcraft network.</h2><p className="mt-4 leading-relaxed text-[#65736c] dark:text-stone-300">Have a partnership question, need a vendor demo, or want help with your next order? Our team is ready to help.</p><div className="mt-8 grid gap-4 text-sm font-semibold"><a href="mailto:hello@woodverse.lk" className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#1c614f]" /> hello@woodverse.lk</a><a href="tel:+94112458891" className="flex items-center gap-3"><Phone className="h-5 w-5 text-[#1c614f]" /> +94 11 245 8891</a><span className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#1c614f]" /> Colombo, Sri Lanka</span></div><div className="mt-7 flex gap-3"><a href="https://instagram.com" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-lg bg-[#dbeee3] text-[#1c614f]"><Instagram className="h-5 w-5" /></a><a href="https://facebook.com" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-lg bg-[#dbeee3] text-[#1c614f]"><Facebook className="h-5 w-5" /></a><a href="https://linkedin.com" aria-label="LinkedIn" className="grid h-10 w-10 place-items-center rounded-lg bg-[#dbeee3] text-[#1c614f]"><Linkedin className="h-5 w-5" /></a></div></div><form onSubmit={(event) => { event.preventDefault(); setContactSent(true); }} className="rounded-2xl border border-[#dce5df] bg-white p-6 shadow-xl dark:border-white/10 dark:bg-white/5 sm:p-8"><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Name<input required className="min-h-12 rounded-lg border border-[#dce5df] bg-[#f7f8f5] px-4 outline-none focus:border-[#1c614f] dark:border-white/10 dark:bg-white/5" placeholder="Your name" /></label><label className="grid gap-2 text-sm font-bold">Email<input required type="email" className="min-h-12 rounded-lg border border-[#dce5df] bg-[#f7f8f5] px-4 outline-none focus:border-[#1c614f] dark:border-white/10 dark:bg-white/5" placeholder="you@company.com" /></label></div><label className="mt-4 grid gap-2 text-sm font-bold">I am a<select className="min-h-12 rounded-lg border border-[#dce5df] bg-[#f7f8f5] px-4 outline-none focus:border-[#1c614f] dark:border-white/10 dark:bg-white/5"><option>Customer</option><option>Vendor</option><option>Supplier</option><option>Partner</option></select></label><label className="mt-4 grid gap-2 text-sm font-bold">Message<textarea required rows={5} className="rounded-lg border border-[#dce5df] bg-[#f7f8f5] px-4 py-3 outline-none focus:border-[#1c614f] dark:border-white/10 dark:bg-white/5" placeholder="How can we help?" /></label><button type="submit" className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#1c614f] px-5 font-extrabold text-white">{contactSent ? "Message sent" : "Send Message"} <Send className="h-4 w-4" /></button></form></section>

      <footer className="bg-[#102f27] py-14 text-white"><div className="page-shell grid gap-10 md:grid-cols-[1.3fr_1fr_1fr]"><div><div className="flex items-center gap-3"><img src="/assets/woodverse-logo.png" alt="WoodVerse" className="h-10 w-10 rounded-lg" /><strong className="text-xl">WoodVerse</strong></div><p className="mt-4 max-w-xs text-sm leading-relaxed text-emerald-100/65">The connected platform for customers, vendors, and suppliers in woodcraft.</p></div>{[["Platform", "About", "Features", "Pricing", "Contact"], ["Legal", "Privacy Policy", "Terms & Conditions", "Cookie Policy"]].map(([title, ...links]) => <div key={title}><h3 className="font-extrabold text-[#d8a36b]">{title}</h3><div className="mt-4 grid gap-3 text-sm text-emerald-100/65">{links.map((link) => <button key={link} onClick={() => { const target = `#${link.toLowerCase().replaceAll(" ", "-")}`; document.querySelector(target)?.scrollIntoView({ behavior: "smooth" }); }} className="text-left transition hover:text-white">{link}</button>)}</div></div>)}</div><div className="page-shell mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6 text-xs text-emerald-100/55"><span>© 2026 WoodVerse. All rights reserved.</span><span>Made for sustainable Sri Lankan craftsmanship.</span></div></footer>
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="fixed bottom-5 right-5 z-30 grid h-11 w-11 place-items-center rounded-full bg-[#d8a36b] text-[#17231f] shadow-xl transition hover:-translate-y-1" aria-label="Scroll to top"><ArrowLeft className="h-5 w-5 rotate-90" /></button>
    </main>
  );
}

export function AnimatedStat({ value, suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);
  const statRef = useRef(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const element = statRef.current;
    if (!element) return undefined;

    const finish = () => {
      if (hasStarted.current) return;
      hasStarted.current = true;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || typeof IntersectionObserver === "undefined") {
        setDisplayValue(value);
        return;
      }

      const startTime = performance.now();
      const duration = 1400;
      const animate = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easedProgress = 1 - (1 - progress) ** 3;
        setDisplayValue(value * easedProgress);
        if (progress < 1) window.requestAnimationFrame(animate);
      };
      window.requestAnimationFrame(animate);
    };

    if (typeof IntersectionObserver === "undefined") {
      finish();
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        finish();
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  const formattedValue = Number.isInteger(value)
    ? Math.round(displayValue).toLocaleString()
    : displayValue.toFixed(1);

  return <strong ref={statRef} className="text-4xl font-extrabold text-[#d8a36b]">{formattedValue}{suffix}</strong>;
}

export function ShieldIcon(props) {
  return <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-current text-[10px] font-black" {...props}>✓</span>;
}

export function ProductSection({ id, title, subtitle, items, addToCart, columns = "grid-cols-3" }) {
  return (
    <section id={id} className="page-shell py-8">
      <SectionHeading title={title} subtitle={subtitle} />
      <div className={`grid gap-6 ${columns} max-lg:grid-cols-2 max-sm:grid-cols-1`}>
        {items.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
      </div>
    </section>
  );
}
