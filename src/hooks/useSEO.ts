import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

export const useSEO = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  twitterTitle,
  twitterDescription,
  canonicalUrl,
  structuredData
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = title;
    }

    // Update meta tags
    const updateMetaTag = (name: string, content: string, property?: boolean) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    if (description) {
      updateMetaTag('description', description);
    }

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    // Open Graph tags
    if (ogTitle) {
      updateMetaTag('og:title', ogTitle, true);
    }

    if (ogDescription) {
      updateMetaTag('og:description', ogDescription, true);
    }

    if (ogImage) {
      updateMetaTag('og:image', ogImage, true);
    }

    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'Ekrem İmamoğlu Ne Dedi', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    
    if (twitterTitle) {
      updateMetaTag('twitter:title', twitterTitle);
    }

    if (twitterDescription) {
      updateMetaTag('twitter:description', twitterDescription);
    }

    if (ogImage) {
      updateMetaTag('twitter:image', ogImage);
    }

    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }

    // Structured Data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Additional SEO meta tags
    updateMetaTag('robots', 'index, follow');
    updateMetaTag('author', 'Ekrem İmamoğlu Ne Dedi');
    updateMetaTag('language', 'tr');
    updateMetaTag('revisit-after', '1 day');

  }, [title, description, keywords, ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription, canonicalUrl, structuredData]);
};

// Generate structured data for the website
export const generateWebsiteStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Ekrem İmamoğlu Ne Dedi",
  "description": "Ekrem İmamoğlu'nun sosyal medya hesaplarındaki güncel açıklamalarını takip edin",
  "url": window.location.origin,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${window.location.origin}?search={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Ekrem İmamoğlu Ne Dedi",
    "url": window.location.origin
  }
});

// Generate structured data for a specific post
export const generatePostStructuredData = (post: {
  content: string;
  summary: string;
  date: string;
  platform: string;
  url?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "SocialMediaPosting",
  "headline": post.summary,
  "text": post.content,
  "datePublished": post.date,
  "author": {
    "@type": "Person",
    "name": "Ekrem İmamoğlu",
    "jobTitle": "İstanbul Büyükşehir Belediye Başkanı",
    "url": "https://www.ibb.istanbul"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Ekrem İmamoğlu Ne Dedi",
    "url": window.location.origin
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": window.location.href
  },
  "url": post.url || window.location.href
});