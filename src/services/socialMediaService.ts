export interface SocialMediaPost {
  id: string;
  content: string;
  summary: string;
  platform: 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'rss';
  date: string;
  time: string;
  url?: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  tags: string[];
  category?: string;
  imageUrl?: string;
  author?: {
    username: string;
    name: string;
    verified: boolean;
  };
}

class SocialMediaService {
  private cache: Map<string, { data: SocialMediaPost[]; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Removed RSS parser to fix browser compatibility issues
  }

  // Real RSS feed URLs for Ekrem İmamoğlu's social media accounts
  private readonly RSS_FEEDS = {
    twitter_cb: 'https://rss.app/feeds/v1.1/_CBAdayOfisi.rss',
    twitter_int: 'https://rss.app/feeds/v1.1/_imamoglu_int.rss',
    instagram: 'https://rss.app/feeds/v1.1/_ekremimamoglu_instagram.rss',
    facebook: 'https://rss.app/feeds/v1.1/_imamogluekrem_facebook.rss',
    youtube: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCT0byua4qIz2wtrmnXoPK6w'
  };

  private cleanContent(content: string): string {
    // Remove HTML tags and clean up content
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 500); // Limit content length
  }

  private generateSummary(content: string): string {
    // Generate a summary from the first sentence or first 100 characters
    const sentences = content.split(/[.!?]+/);
    const firstSentence = sentences[0]?.trim();
    
    if (firstSentence && firstSentence.length > 20 && firstSentence.length <= 150) {
      return firstSentence + '.';
    }
    
    return content.substring(0, 120) + '...';
  }

  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract hashtags
    const hashtags = content.match(/#\w+/g);
    if (hashtags) {
      tags.push(...hashtags.map(tag => tag.substring(1)));
    }

    // Add contextual tags based on keywords
    const keywords = {
      'İstanbul': ['İstanbul', 'Şehir'],
      'belediye': ['Belediye', 'Yönetim'],
      'proje': ['Proje', 'Gelişim'],
      'ulaşım': ['Ulaşım', 'Metro'],
      'çevre': ['Çevre', 'Yeşil'],
      'gençlik': ['Gençlik', 'Eğitim'],
      'kültür': ['Kültür', 'Sanat'],
      'spor': ['Spor', 'Sağlık'],
      'ekonomi': ['Ekonomi', 'İş'],
      'sosyal': ['Sosyal', 'Toplum']
    };

    Object.entries(keywords).forEach(([keyword, relatedTags]) => {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(...relatedTags);
      }
    });

    return [...new Set(tags)].slice(0, 5); // Remove duplicates and limit to 5 tags
  }

  private categorizeContent(content: string): string {
    const categories = {
      'Ulaşım': ['metro', 'otobüs', 'ulaşım', 'trafik', 'yol'],
      'Çevre': ['çevre', 'yeşil', 'park', 'ağaç', 'temiz'],
      'Kültür': ['kültür', 'sanat', 'müze', 'tiyatro', 'konser'],
      'Spor': ['spor', 'stadyum', 'futbol', 'basketbol', 'olimpiyat'],
      'Eğitim': ['eğitim', 'okul', 'üniversite', 'öğrenci', 'kurs'],
      'Ekonomi': ['ekonomi', 'iş', 'yatırım', 'ticaret', 'istihdam'],
      'Sosyal': ['sosyal', 'yardım', 'destek', 'hizmet', 'vatandaş']
    };

    const lowerContent = content.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category;
      }
    }

    return 'Genel';
  }

  private extractImageUrl(): string | undefined {
    // Placeholder for image extraction - would be implemented with real RSS feeds
    return undefined;
  }

  private generateMockEngagement(): { likes: number; shares: number; comments: number } {
    // Generate realistic engagement numbers
    const base = Math.floor(Math.random() * 1000) + 100;
    return {
      likes: base + Math.floor(Math.random() * 500),
      shares: Math.floor(base * 0.3) + Math.floor(Math.random() * 100),
      comments: Math.floor(base * 0.1) + Math.floor(Math.random() * 50)
    };
  }

  async getAllPosts(): Promise<SocialMediaPost[]> {
    const cacheKey = 'all_posts';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('📦 Using cached data');
      return cached.data;
    }

    console.log('🔄 Fetching fresh data from all sources...');
    
    const allPosts: SocialMediaPost[] = [];
    let hasAnyData = false;

    try {
      // Fetch real Twitter data from our edge function
      console.log('📱 Fetching Twitter data...');
      const twitterPosts = await this.fetchRealTwitterData();
      if (twitterPosts.length > 0) {
        allPosts.push(...twitterPosts);
        hasAnyData = true;
        console.log(`✅ Twitter: ${twitterPosts.length} posts loaded`);
      } else {
        console.warn('⚠️ Twitter: No posts received');
      }
    } catch (error) {
      console.error('❌ Twitter fetch failed:', error);
    }

    try {
      // Fetch RSS feeds for other platforms
      console.log('📡 Fetching RSS feeds...');
      const rssPosts = await this.fetchRealRSSFeeds();
      if (rssPosts.length > 0) {
        allPosts.push(...rssPosts);
        hasAnyData = true;
        console.log(`✅ RSS: ${rssPosts.length} posts loaded`);
      } else {
        console.warn('⚠️ RSS: No posts received');
      }
    } catch (error) {
      console.error('❌ RSS fetch failed:', error);
    }

    // If we have any data, use it
    if (hasAnyData) {
      // Sort by date (newest first)
      allPosts.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());

      // Cache the results
      this.cache.set(cacheKey, { data: allPosts, timestamp: Date.now() });

      console.log(`🎉 Total posts loaded: ${allPosts.length}`);
      return allPosts;
    }

    // If no data from any source, return cached data if available (even if expired)
    if (cached) {
      console.log('📦 Using expired cache as fallback');
      return cached.data;
    }

    // Last resort: return mock data with error message
    console.warn('⚠️ All data sources failed, using fallback data');
    return this.getMockData();
  }

  private async fetchRealTwitterData(): Promise<SocialMediaPost[]> {
    try {
      const response = await fetch('https://jqwosbv3--fetch-twitter-data.functions.blink.new');
      
      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`Fetched ${data.data.length} real Twitter posts`);
        return data.data;
      } else {
        console.warn('Twitter API returned no data:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching real Twitter data:', error);
      return [];
    }
  }

  private async fetchRealRSSFeeds(): Promise<SocialMediaPost[]> {
    try {
      console.log('🔄 Fetching RSS feeds from backend...');
      
      const response = await fetch('https://jqwosbv3--fetch-rss-feeds.functions.blink.new', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`RSS API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`✅ ${data.data.length} RSS posts fetched successfully`);
        return data.data;
      } else {
        console.warn('RSS API returned no data:', data);
        return [];
      }
    } catch (error) {
      console.error('Error fetching RSS feeds from backend:', error);
      return [];
    }
  }

  // RSS fetching is now handled by the backend function
  // This method is kept for backward compatibility but not used

  // RSS parsing is now handled by the backend function

  private generateRealisticEngagement(platform: string, contentLength: number): { likes: number; shares: number; comments: number } {
    // Base engagement based on platform popularity
    const platformMultipliers = {
      twitter: 1.2,
      instagram: 1.5,
      facebook: 1.0,
      youtube: 0.8,
      rss: 0.5
    };

    const multiplier = platformMultipliers[platform as keyof typeof platformMultipliers] || 1.0;
    const contentFactor = Math.min(contentLength / 200, 2); // Longer content gets more engagement

    const baseEngagement = Math.floor(Math.random() * 1000 + 500) * multiplier * contentFactor;

    return {
      likes: Math.floor(baseEngagement + Math.random() * 500),
      shares: Math.floor(baseEngagement * 0.3 + Math.random() * 100),
      comments: Math.floor(baseEngagement * 0.15 + Math.random() * 50)
    };
  }

  private getMockData(): SocialMediaPost[] {
    // Fallback data with helpful error message
    const today = new Date();

    return [
      {
        id: 'system_message_1',
        content: '⚠️ Sosyal medya beslemeleri şu anda yüklenemiyor. Bu durum geçicidir ve genellikle birkaç dakika içinde düzelir. Lütfen sayfayı yenileyin veya birkaç dakika sonra tekrar deneyin. Twitter API ve RSS beslemeleri yeniden bağlanmaya çalışılıyor...',
        summary: 'Sosyal medya beslemeleri geçici olarak kullanılamıyor.',
        platform: 'rss',
        date: today.toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        engagement: { likes: 0, shares: 0, comments: 0 },
        tags: ['Sistem', 'Bilgi', 'Geçici'],
        category: 'Sistem',
        url: ''
      },
      {
        id: 'system_message_2',
        content: '🔧 Teknik Bilgi: Site şu anda Twitter API v2 ve RSS beslemelerinden gerçek zamanlı veri çekmeye çalışıyor. Bağlantı sorunları genellikle kısa sürelidir. Veriler başarıyla yüklendiğinde bu mesajlar otomatik olarak kaybolacak.',
        summary: 'Sistem durumu ve teknik bilgiler.',
        platform: 'rss',
        date: today.toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        engagement: { likes: 0, shares: 0, comments: 0 },
        tags: ['Teknik', 'API', 'Durum'],
        category: 'Sistem',
        url: ''
      }
    ];
  }

  // Advanced search functionality
  searchPosts(posts: SocialMediaPost[], query: string): SocialMediaPost[] {
    if (!query.trim()) return posts;

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
    
    return posts.filter(post => {
      const searchableText = [
        post.content,
        post.summary,
        ...post.tags,
        post.category || ''
      ].join(' ').toLowerCase();

      return searchTerms.every(term => searchableText.includes(term));
    });
  }

  // Filter posts by various criteria
  filterPosts(posts: SocialMediaPost[], filters: {
    platform?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    tags?: string[];
  }): SocialMediaPost[] {
    return posts.filter(post => {
      if (filters.platform && post.platform !== filters.platform) {
        return false;
      }

      if (filters.category && post.category !== filters.category) {
        return false;
      }

      if (filters.dateFrom && post.date < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && post.date > filters.dateTo) {
        return false;
      }

      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          post.tags.some(postTag => postTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }

  // Get unique categories from posts
  getCategories(posts: SocialMediaPost[]): string[] {
    const categories = posts
      .map(post => post.category)
      .filter((category): category is string => category !== undefined);
    
    return [...new Set(categories)].sort();
  }

  // Get popular tags
  getPopularTags(posts: SocialMediaPost[], limit: number = 20): string[] {
    const tagCounts = new Map<string, number>();
    
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag]) => tag);
  }
}

export const socialMediaService = new SocialMediaService();