import type { SiteConfig } from "../site.types";

/**
 * Konfigurasi website Yovela Trade Limited.
 * Untuk website lain: salin file ini, ganti nilainya, lalu daftarkan di src/config/index.ts.
 */
export const yovela: SiteConfig = {
  name: "Yovela Trade Limited",
  baseUrl: process.env.BASE_URL ?? "https://staging.yovela-trading.com/",
  pageTitle: "Yovela Trade Limited · 樂易貿易有限公司",
  ignoredErrorUrls: ["cloudflareinsights.com"],

  sections: [
    { id: "hero", title: "Trading Quality." },
    { id: "about", title: "A Trusted Name in Trade", menu: "About" },
    { id: "products", title: "Our Products & Services", menu: "Products" },
    { id: "why", title: "Why Choose Yovela", menu: "Why Us" },
    { id: "global", title: "Your Bridge Between Markets", menu: "Global Trade" },
    { id: "contact", title: "Start a Conversation", menu: "Contact" },
  ],
  contactSectionId: "contact",

  selectors: {
    navbar: "#navbar",
    navLogo: "#navbar .nav-logo",
    navLinks: "#navbar .nav-links",
    navCta: "#navbar .nav-cta",
    hamburger: "#navbar button, #navbar [aria-label*='menu' i], #navbar .hamburger, #navbar .menu-toggle",
    sectionTitle: ".section-title",
    footer: "footer",
  },

  hero: {
    texts: [
      "Hong Kong · Est. 2023",
      "Trading Quality.",
      "Connecting the World.",
      "Yovela Trade Limited · 樂易貿易有限公司",
    ],
    buttons: [
      { name: "Explore Products", target: "products" },
      { name: "About Us", target: "about" },
    ],
    scrollHint: ".scroll-hint",
  },

  contactForm: {
    selectors: {
      name: "input[name='name']",
      company: "input[name='company']",
      email: "input[name='email']",
      interest: "select[name='interest']",
      message: "textarea[name='message']",
      submit: "button[type='submit']",
    },
    labels: {
      name: "Your Name",
      company: "Company",
      email: "Email Address",
      interest: "Area of Interest",
      message: "Message",
    },
    placeholderOption: "Select a category...",
    interestOptions: ["Household Products", "Daily Consumer Goods", "Import Services", "Export Services", "General Enquiry"],
    successMessage: "Thank you! Your message has been sent.",
    errorMessage: "Failed to send message. Please try again later.",
    loadingText: "Sending...",
    rules: {
      name: { required: true, min: 2, max: 50 },
      company: { required: false, max: 100 },
      email: { required: true, max: 254 },
      message: { required: true, min: 10, max: 1000 },
    },
  },

  api: {
    contactEndpoint: "api/contact",
  },

  footer: {
    texts: [
      "YOVELA TRADE LIMITED",
      "樂易貿易有限公司",
      "All Rights Reserved.",
      "CR No. 3305282",
      "BR No. 75580592",
      "Incorporated 03 Aug 2023",
      "Registered in Hong Kong SAR, China",
    ],
    copyrightName: "Yovela Trade Limited",
  },
};
