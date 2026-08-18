import "dotenv/config";
import { connectDb, disconnectDb } from "../db/connect.js";
import { Page, type SectionAttrs } from "../models/Page.js";

/**
 * Seeds the home page from the content currently hard-coded in the frontend
 * components, so the admin has something real to edit on day one.
 *
 * Re-running overwrites the home document — run it only to (re)initialise.
 *
 *   npm run seed:home
 */

const sections: SectionAttrs[] = [
  {
    key: "hero",
    type: "hero",
    order: 0,
    enabled: true,
    data: {
      background: {
        src: "https://assets.cdn.filesafe.space/fXZotDuybTTvQxQ4Yxkp/media/6a4f7734708c41d4df2480e5.png",
        alt: "",
        title: "",
        description: "Abstract DNA and network artwork behind the hero.",
      },
      left: {
        title: "Healthcare Made",
        titleAccent: "Affordable",
        subtitle:
          "Skip the insurance headaches. Get everyday healthcare with **clear, upfront pricing** and **zero hidden fees**.",
        features: [
          {
            icon: "stethoscope",
            title: "Unlimited Virtual \nDoctor Visits",
            value: "{{#FFFFFF|at}} $0",
          },
          { icon: "imaging", title: "Imaging", value: "Diagnostics" },
          { icon: "medications", title: "1,100+ Medications", value: "{{#FFFFFF|at}} $0" },
          { icon: "mentalHealth", title: "Mental Health", value: "Wellness" },
          { icon: "labTests", title: "3,900+ Lab Tests", value: "{{#FFFFFF|at}} $0" },
          { icon: "aiDoctor", title: "AI Doctor™", value: "Guidance" },
        ],
      },
      right: {
        title: "Health Made",
        titleAccent: "Optimal",
        subtitle:
          "We go beyond basic care to help you **optimize your health** with **advanced tools**, treatments, and concierge support.",
        features: [
          {
            icon: "advancedLab",
            title: "Advanced Lab \nTesting",
            value: "{{#FFFFFF|Included}} at $0",
          },
          { icon: "hormone", title: "Hormone & \nMetabolic Health", value: "Included" },
          { icon: "peptides", title: "GLP-1s & Peptides", value: "Available" },
          { icon: "behavioral", title: "Behavioral Health \nSupport", value: "Included" },
          { icon: "lifestyle", title: "Lifestyle & Wellness", value: "Included" },
          { icon: "concierge", title: "Concierge Care", value: "Included" },
        ],
      },
      membershipCard: {
        lines: ["ONE", "PRIVATE", "HEALTHCARE", "MEMBERSHIP"],
        priceLabel: "All for",
        price: "$149",
        pricePeriod: "/mo",
        disclaimer: "*$149/mo covers up to 7 members",
      },
      bridge:
        "**One private healthcare membership** that lowers the {{blue|cost of everyday care}} while giving your family access to services designed to {{green|improve long-term health}}.",
      ctas: [
        { label: "See Plans & Pricing", sublabel: "For individuals & families", href: "/plans", variant: "family" },
        { label: "Enroll Your Organization", sublabel: "For employers & groups", href: "/employers", variant: "org" },
      ],
      link: { label: "See how it works →", href: "#how-it-works" },
      trustItems: [
        "No contracts",
        "Cancel anytime",
        "Instant access",
        "Up to 7 family members",
        "24/7 care access",
        "HIPAA secure & private",
      ],
    },
  },
  {
    key: "careCoverage",
    type: "careCoverage",
    order: 1,
    enabled: true,
    data: {
      eyebrow: "What's Covered",
      title: "Comprehensive Care Coverage",
      subtitle:
        "OptimalMD can treat up to **90%** of routine medical needs and **30%** of emergency room conditions.",
      source: "Source: American Medical Association (AMA)",
      panes: [
        {
          id: "rx",
          tabTitle: "Prescriptions",
          tabDetail: "1,100+ meds at $0",
          tag: "Pharmacy Benefit",
          heading: "Prescriptions",
          items: [
            "**1,100+ medications** included ($0)",
            "**3,900+ medications** at $15 or less",
            "Access to all FDA-approved medications",
            "Transfer existing prescriptions and save more",
          ],
        },
        {
          id: "lab",
          tabTitle: "Lab Tests",
          tabDetail: "3,900+ tests at $0",
          tag: "Diagnostics",
          heading: "Lab Tests",
          items: [
            "**3,900+ lab tests** included ($0)",
            "Advanced diagnostic lab tests",
            "Hormone panels, metabolic tests, cancer screening",
            "Micronutrient testing, and more",
          ],
        },
        {
          id: "doc",
          tabTitle: "Doctors",
          tabDetail: "Unlimited $0 visits",
          tag: "Virtual Care",
          heading: "Doctors",
          items: [
            "**Unlimited virtual doctor access** ($0)",
            "Virtual Urgent and Primary Care",
            "Consult with **13 specialists**",
            "Concierge medical services",
          ],
          note: "*In-person visits available via care coordination at reduced rates",
        },
        {
          id: "mh",
          tabTitle: "Mental Health",
          tabDetail: "$0 licensed therapists",
          tag: "Behavioral Health",
          heading: "Mental Health",
          items: [
            "**Licensed behavioral therapists** ($0)",
            "24/7 access to licensed counselors",
            "“Talk Therapy” at no additional cost",
            "Psychology and psychiatry services available*",
          ],
        },
      ],
    },
  },
  {
    key: "audiences",
    type: "audiences",
    order: 2,
    enabled: true,
    data: {
      eyebrow: "Plans For Everyone",
      title: "One Membership. Three Ways In.",
      cards: [
        {
          tag: "For You",
          title: "Individuals & Families",
          body: "Save $5,000–$30,000/year. Cover up to 7 household members. Complete healthcare privacy.",
          amount: "$149",
          per: "/month · up to 7 people",
          href: "https://optimalmd.com/pricing",
          featured: true,
          badge: "Most Popular",
        },
        {
          tag: "For Workers",
          title: "Employees",
          body: "A benefit you actually use, every month. $0 per visit, including unlimited mental health. Completely private.",
          amount: "$0",
          per: "/visit, always",
          href: "https://optimalmd.com/employees",
          featured: false,
        },
        {
          tag: "For Business",
          title: "Employers",
          body: "Better benefits than competitors at 70–90% less cost. Attract and retain top talent with healthcare they'll talk about.",
          amount: "$99–149",
          per: "/employee per month",
          href: "https://optimalmd.com/employers",
          featured: false,
        },
      ],
    },
  },
  {
    key: "network",
    type: "network",
    order: 3,
    enabled: true,
    data: {
      eyebrow: "What You Get With OptimalMD",
      title: "National Pharmacy & Laboratory Network",
      logos: {
        src: "https://assets.cdn.filesafe.space/fXZotDuybTTvQxQ4Yxkp/media/693e5106b4f420a9fe13b5c6.png",
        alt: "OptimalMD pharmacy and lab network: CVS Pharmacy, Kroger, Walgreens, Walmart Pharmacy, Costco, Publix, Safeway, Labcorp, Quest Diagnostics",
        title: "OptimalMD pharmacy and laboratory partners",
        description:
          "Logos of the pharmacy and laboratory chains contracted with OptimalMD, including CVS, Kroger, Walgreens, Walmart, Costco, Publix, Safeway, Labcorp and Quest Diagnostics.",
      },
      stats: [
        { value: "70000", suffix: "+", countUp: true, label: "Pharmacies contracted nationwide" },
        { value: "Mail Order", countUp: false, label: "Also available" },
        { value: "Labcorp + Quest", countUp: false, label: "Nationwide lab draw locations" },
      ],
    },
  },
  {
    key: "noList",
    type: "noList",
    order: 4,
    enabled: true,
    data: {
      eyebrow: "The Fine Print: There Isn't Any",
      pills: [
        "no deductibles",
        "no copays",
        "no denials",
        "no limits",
        "no surprise bills",
        "no exclusions",
        "no referrals",
        "no risk",
        "no contracts",
        "no ID needed",
      ],
      headline: "no insurance required",
      note: "We are **not** insurance.",
    },
  },
  {
    key: "appPromo",
    type: "appPromo",
    order: 5,
    enabled: true,
    data: {
      eyebrow: "Always With You",
      title: "Concierge healthcare,",
      titleAccent: "at your convenience.",
      subtitle:
        "Make doctor appointments, manage your medications, consult with specialists. From home or away, 24/7. Anytime. Anywhere. Always there.",
      appStoreUrl: "https://apps.apple.com/us/app/optimalmd/id6752685266",
      googlePlayUrl: "https://play.google.com/store/apps/details?id=com.optimalmdapp.app",
      phone: {
        src: "https://assets.cdn.filesafe.space/fXZotDuybTTvQxQ4Yxkp/media/6a1d5c96d7322952d176f036.webp",
        alt: "OptimalMD mobile app home screen showing physician access, pharmacy, and My AI Doctor",
        title: "The OptimalMD app",
        description:
          "The OptimalMD mobile app home screen, showing shortcuts to physician access, the pharmacy benefit and My AI Doctor.",
      },
    },
  },
  {
    key: "whyOptimalMD",
    type: "whyOptimalMD",
    order: 6,
    enabled: true,
    data: {
      eyebrow: "Why OptimalMD",
      title: "Real Healthcare. Not a Discount Card.",
      cards: [
        {
          icon: {
            src: "https://assets.cdn.filesafe.space/fXZotDuybTTvQxQ4Yxkp/media/6a151ccee05851175c8813b5.svg",
            alt: "Telehealth icon",
            title: "Unlimited telehealth",
            description: "Icon representing unlimited $0 virtual doctor visits.",
          },
          stat: "$0",
          title: "Unlimited Telehealth",
          body: "Save $5,000–$30,000/year. Cover up to 7 household members. Complete healthcare privacy.",
        },
        {
          icon: {
            src: "https://assets.cdn.filesafe.space/fXZotDuybTTvQxQ4Yxkp/media/6a151d7f60ad4b0619388399.svg",
            alt: "Medications and lab tests icon",
            title: "Medications and lab tests",
            description: "Icon representing $0 medications and diagnostic lab tests.",
          },
          stat: "$0",
          title: "Medications and Lab Tests",
          body: "1,100+ generics at 70,000+ pharmacies. Plus 3,900+ Labcorp diagnostic tests. No prior auth, no formulary battles.",
        },
        {
          icon: {
            src: "https://assets.cdn.filesafe.space/fXZotDuybTTvQxQ4Yxkp/media/6a1ec7e3e2e735bbc360f066.svg",
            alt: "Privacy lock icon",
            title: "No MIB reporting",
            description: "Icon representing healthcare privacy outside the insurance ecosystem.",
          },
          stat: "Never",
          title: "No MIB Reporting",
          body: "OptimalMD operates outside the insurance ecosystem. Your visits and diagnoses never enter the MIB database.",
        },
      ],
    },
  },
  {
    key: "givesBack",
    type: "givesBack",
    order: 7,
    enabled: true,
    data: {
      eyebrow: "Beyond Medical Benefits",
      title: "Healthcare That Gives Back",
      subtitle: "…it's more than just medical benefits, hover over each card to see how.",
      cards: [
        {
          icon: "control",
          title: "Control",
          summary: "Care on your terms: book, consult, and treat with no gatekeepers.",
          backTitle: "Take charge of your health",
          bullets: [
            "Book appointments on your schedule",
            "Unlimited access to the medications you need",
            "Consult with medical specialists",
          ],
          tagline: "No exclusions, red tape, or delays. Just freedom.",
        },
        {
          icon: "savings",
          title: "Savings",
          summary: "Cut copays, deductibles, and wasted time, thousands back every year.",
          backTitle: "Cut costs and save time",
          bullets: [
            "Transfer high-priced prescriptions",
            "Eliminate copays, deductibles, and fees",
            "Skip crowded waiting rooms and wasted travel",
          ],
          tagline: "Quality care for less cost, quicker than ever.",
        },
        {
          icon: "peace",
          title: "Peace",
          summary: "Your whole family covered in one trusted place, no surprise bills.",
          backTitle: "All your care, one trusted place",
          bullets: [
            "Secure, anytime access to care",
            "Manage everything from one hub",
            "Support for you and your family",
          ],
          tagline: "Relax. We have you covered.",
        },
        {
          icon: "possibilities",
          title: "Possibilities",
          summary: "Personalized care and advanced tools, healthcare without limits.",
          backTitle: "Unlock your best health yet",
          bullets: [
            "Personalize your care and treatment",
            "Your personal private healthcare network",
            "Advanced technology platform",
          ],
          tagline:
            "We help you thrive, not just survive. OptimalMD is healthcare without limits.",
        },
      ],
    },
  },
  {
    key: "finalCta",
    type: "finalCta",
    order: 8,
    enabled: true,
    data: {
      eyebrow: "Ready When You Are",
      title: "Let's Get Started!",
      subtitle:
        "All of this and *more* is included in your monthly bundle plan.\nClick the button below for the healthcare you deserve.",
      ctaLabel: "See Monthly Plans",
      ctaHref: "https://optimalmd.com/pricing",
    },
  },
];

async function main() {
  await connectDb();

  const seo = {
    title: "OptimalMD | Healthcare Made Affordable: $0 Doctor Visits, Medications & Labs",
    description:
      "OptimalMD is a private healthcare network with unlimited $0 virtual doctor visits, 1,100+ $0 medications, 3,900+ $0 lab tests, and $0 licensed therapists. No deductibles, no copays, no insurance required. Plans from $149/month for up to 7 family members.",
    canonical: "https://optimalmd.com/",
    ogTitle: "OptimalMD | Healthcare Made Affordable",
    ogDescription:
      "Unlimited $0 virtual care, medications, and labs, no insurance middlemen, no deductibles, no copays. Up to 7 family members from $149/month.",
    ogImage:
      "https://assets.cdn.filesafe.space/fXZotDuybTTvQxQ4Yxkp/media/6a406189d50c4ff1841c7847.png",
    noindex: false,
    nofollow: false,
    twitterCard: "summary_large_image" as const,
    keywords: [
      "private healthcare membership",
      "$0 telehealth",
      "$0 medications",
      "$0 lab tests",
      "healthcare without insurance",
    ],
    schema: {
      organization: { enabled: true },
      webPage: { enabled: true, type: "WebPage" as const },
      faq: { enabled: false, items: [] },
      breadcrumbs: { enabled: false, items: [] },
    },
  };

  await Page.findOneAndUpdate(
    { slug: "home" },
    { slug: "home", name: "Home", seo, sections, publishedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.log(`Seeded page "home" with ${sections.length} sections.`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
