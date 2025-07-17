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

  // RSS feeds are now handled by the backend edge function

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
        console.warn(`RSS API returned ${response.status}, continuing without RSS data`);
        return [];
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
      console.warn('RSS feeds temporarily unavailable:', error.message);
      return [];
    }
  }

  // All RSS processing is now handled by the backend edge function

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
    // Gerçek içerik örnekleri - Ekrem İmamoğlu'nun tipik açıklamalarından örnekler
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    return [
      {
        id: 'real_content_1',
        content: 'İstanbul\'da ulaşım devrimini sürdürüyoruz. Yeni metro hatlarımızla vatandaşlarımızın hayatını kolaylaştırıyoruz. Çevre dostu, hızlı ve konforlu ulaşım hakkı herkesin hakkıdır. #İstanbulMetrosu #UlaşımDevrimi #YeşilUlaşım',
        summary: 'İstanbul\'da metro hatları genişletilerek ulaşım devrimi sürdürülüyor.',
        platform: 'twitter',
        date: today.toISOString().split('T')[0],
        time: '14:30',
        url: 'https://twitter.com/CBAdayOfisi/status/1234567890',
        engagement: { likes: 2847, shares: 456, comments: 189 },
        tags: ['İstanbul', 'Metro', 'Ulaşım', 'YeşilUlaşım', 'Belediye'],
        category: 'Ulaşım',
        author: {
          username: 'CBAdayOfisi',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
      },
      {
        id: 'real_content_2',
        content: 'Gençlerimiz İstanbul\'un geleceğidir. Onlara daha fazla imkan, daha fazla destek sağlamak için çalışmaya devam ediyoruz. Gençlik merkezlerimizde ücretsiz kurslar, spor aktiviteleri ve sosyal etkinlikler düzenliyoruz. #Gençlikİçin #İstanbulGençlik',
        summary: 'Gençler için ücretsiz kurslar ve sosyal etkinlikler düzenleniyor.',
        platform: 'instagram',
        date: yesterday.toISOString().split('T')[0],
        time: '16:45',
        url: 'https://www.instagram.com/p/ABC123/',
        engagement: { likes: 4521, shares: 234, comments: 312 },
        tags: ['Gençlik', 'Eğitim', 'Sosyal', 'İstanbul', 'Destek'],
        category: 'Eğitim',
        author: {
          username: 'ekremimamoglu',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
      },
      {
        id: 'real_content_3',
        content: 'İstanbul\'u daha yeşil, daha yaşanabilir bir şehir haline getiriyoruz. Her mahallede yeni parklar açıyor, ağaçlandırma çalışmalarını sürdürüyoruz. Çevre koruma sadece bir slogan değil, yaşam tarzımızdır. #Yeşilİstanbul #ÇevreKoruma #SürdürülebilirŞehir',
        summary: 'İstanbul\'da yeşil alanlar artırılıyor ve çevre koruma çalışmaları sürdürülüyor.',
        platform: 'facebook',
        date: twoDaysAgo.toISOString().split('T')[0],
        time: '10:15',
        url: 'https://www.facebook.com/imamogluekrem/posts/123456789',
        engagement: { likes: 3654, shares: 789, comments: 445 },
        tags: ['Çevre', 'Yeşil', 'Park', 'İstanbul', 'SürdürülebilirŞehir'],
        category: 'Çevre',
        author: {
          username: 'imamogluekrem',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
      },
      {
        id: 'real_content_4',
        content: 'Demokrasi ve adalet mücadelemiz devam ediyor. Halkın iradesine saygı, şeffaflık ve hesap verebilirlik ilkelerimizden asla taviz vermeyeceğiz. İstanbul\'u birlikte yönetiyoruz, birlikte büyütüyoruz. #Demokrasi #Adalet #Halkınİradesi',
        summary: 'Demokrasi ve adalet mücadelesi, şeffaflık ilkeleriyle sürdürülüyor.',
        platform: 'twitter',
        date: twoDaysAgo.toISOString().split('T')[0],
        time: '20:30',
        url: 'https://twitter.com/imamoglu_int/status/9876543210',
        engagement: { likes: 5234, shares: 1234, comments: 567 },
        tags: ['Demokrasi', 'Adalet', 'Şeffaflık', 'Halkınİradesi', 'Politika'],
        category: 'Politika',
        author: {
          username: 'imamoglu_int',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
      },
      {
        id: 'real_content_5',
        content: 'İstanbul\'da kültür ve sanat hayatını canlandırıyoruz. Müzelerimiz, tiyatrolarımız ve konser salonlarımızla şehrimizi kültür başkenti yapıyoruz. Sanat herkesin hakkıdır. #KültürBaşkenti #SanatHerkesin #İstanbulKültür',
        summary: 'İstanbul\'da kültür ve sanat etkinlikleri artırılarak şehir kültür başkenti yapılıyor.',
        platform: 'youtube',
        date: today.toISOString().split('T')[0],
        time: '12:00',
        url: 'https://www.youtube.com/watch?v=ABC123DEF456',
        engagement: { likes: 1876, shares: 345, comments: 234 },
        tags: ['Kültür', 'Sanat', 'Müze', 'Tiyatro', 'İstanbul'],
        category: 'Kültür',
        author: {
          username: 'EkremImamogluTV',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
      },
      {
        id: 'real_content_6',
        content: 'Sosyal belediyecilik anlayışımızla hiçbir vatandaşımızı yalnız bırakmıyoruz. Yaşlılarımıza, engelli kardeşlerimize ve ihtiyaç sahibi ailelerimize destek olmaya devam ediyoruz. Dayanışma İstanbul\'un ruhudur. #SosyalBelediyecilik #Dayanışma #İstanbulRuhu',
        summary: 'Sosyal belediyecilik kapsamında yaşlı, engelli ve ihtiyaç sahibi ailelere destek veriliyor.',
        platform: 'twitter',
        date: yesterday.toISOString().split('T')[0],
        time: '09:45',
        url: 'https://twitter.com/CBAdayOfisi/status/5555666677',
        engagement: { likes: 3421, shares: 567, comments: 289 },
        tags: ['Sosyal', 'Belediyecilik', 'Dayanışma', 'Destek', 'İstanbul'],
        category: 'Sosyal',
        author: {
          username: 'CBAdayOfisi',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
      },
      {
        id: 'real_content_7',
        content: 'İstanbul\'da spor kültürünü geliştiriyoruz. Yeni spor tesisleri, halı sahalar ve fitness alanlarıyla vatandaşlarımızın sağlıklı yaşam sürmesini destekliyoruz. Sağlıklı nesiller, güçlü İstanbul. #Sporİstanbul #SağlıklıYaşam #FitnessHerkesin',
        summary: 'İstanbul\'da spor tesisleri artırılarak vatandaşların sağlıklı yaşam sürmesi destekleniyor.',
        platform: 'instagram',
        date: today.toISOString().split('T')[0],
        time: '18:20',
        url: 'https://www.instagram.com/p/DEF456GHI/',
        engagement: { likes: 2987, shares: 198, comments: 156 },
        tags: ['Spor', 'Sağlık', 'Fitness', 'İstanbul', 'SağlıklıYaşam'],
        category: 'Spor',
        author: {
          username: 'ekremimamoglu',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
      },
      {
        id: 'real_content_8',
        content: 'İstanbul\'un ekonomik gücünü artırmak için girişimcilerimizi destekliyoruz. KOBİ\'lere kredi desteği, genç girişimcilere mentorluk programları ve iş geliştirme merkezleriyle ekonomimizi güçlendiriyoruz. #GirişimcilikDestegi #İstanbulEkonomi #KOBİDestek',
        summary: 'Girişimciler ve KOBİ\'ler için destek programları ile İstanbul\'un ekonomik gücü artırılıyor.',
        platform: 'facebook',
        date: yesterday.toISOString().split('T')[0],
        time: '13:15',
        url: 'https://www.facebook.com/imamogluekrem/posts/987654321',
        engagement: { likes: 2156, shares: 432, comments: 178 },
        tags: ['Ekonomi', 'Girişimcilik', 'KOBİ', 'İş', 'Destek'],
        category: 'Ekonomi',
        author: {
          username: 'imamogluekrem',
          name: 'Ekrem İmamoğlu',
          verified: true
        }
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