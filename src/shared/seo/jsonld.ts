import { toAbsoluteUrl } from "./meta";

import type { MetaDescriptor } from "react-router";

/**
 * JSON-LD 组装（基线 §12）：WebSite（首页）、Person（About）、
 * BlogPosting（文章详情）。返回 RR meta 导出可用的 script:ld+json 描述符。
 */

export function websiteJsonLd(args: {
  name: string;
  url: string;
  description: string;
}): MetaDescriptor {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: args.name,
      url: args.url,
      description: args.description,
    },
  };
}

export function personJsonLd(args: {
  name: string;
  url: string;
  jobTitle?: string;
  description?: string;
  sameAs?: string[];
}): MetaDescriptor {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "Person",
      name: args.name,
      url: args.url,
      ...(args.jobTitle ? { jobTitle: args.jobTitle } : {}),
      ...(args.description ? { description: args.description } : {}),
      ...(args.sameAs && args.sameAs.length > 0 ? { sameAs: args.sameAs } : {}),
    },
  };
}

export function blogPostingJsonLd(args: {
  headline: string;
  description: string;
  siteUrl: string;
  path: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  image?: string;
  inLanguage?: string;
}): MetaDescriptor {
  const url = toAbsoluteUrl(args.siteUrl, args.path);
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: args.headline,
      description: args.description,
      url,
      mainEntityOfPage: url,
      datePublished: args.datePublished,
      ...(args.dateModified ? { dateModified: args.dateModified } : {}),
      author: { "@type": "Person", name: args.authorName },
      ...(args.image
        ? { image: toAbsoluteUrl(args.siteUrl, args.image) }
        : {}),
      ...(args.inLanguage ? { inLanguage: args.inLanguage } : {}),
    },
  };
}
