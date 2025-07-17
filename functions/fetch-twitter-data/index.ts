import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface TwitterPost {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  author_id: string;
  context_annotations?: Array<{
    domain: { name: string };
    entity: { name: string };
  }>;
}

interface TwitterUser {
  id: string;
  username: string;
  name: string;
  verified: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const bearerToken = Deno.env.get('TWITTER_BEARER_TOKEN');
    
    if (!bearerToken) {
      throw new Error('Twitter Bearer Token not configured');
    }

    // Twitter accounts to fetch
    const accounts = [
      'CBAdayOfisi',
      'imamoglu_int'
    ];

    const allPosts = [];

    for (const username of accounts) {
      try {
        // Get user ID first
        const userResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${username}`,
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!userResponse.ok) {
          console.warn(`❌ Failed to fetch user ${username}: HTTP ${userResponse.status}`);
          continue;
        }

        const userData = await userResponse.json();
        const userId = userData.data?.id;

        if (!userId) {
          console.error(`No user ID found for ${username}`);
          continue;
        }

        // Get user's tweets
        const tweetsResponse = await fetch(
          `https://api.twitter.com/2/users/${userId}/tweets?` +
          new URLSearchParams({
            'max_results': '20',
            'tweet.fields': 'created_at,public_metrics,context_annotations,lang',
            'user.fields': 'verified,name,username',
            'expansions': 'author_id'
          }),
          {
            headers: {
              'Authorization': `Bearer ${bearerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!tweetsResponse.ok) {
          console.warn(`❌ Failed to fetch tweets for ${username}: HTTP ${tweetsResponse.status}`);
          continue;
        }

        const tweetsData = await tweetsResponse.json();
        
        if (tweetsData.data && Array.isArray(tweetsData.data)) {
          const userInfo = tweetsData.includes?.users?.[0] || { username, name: username };
          
          for (const tweet of tweetsData.data) {
            // Skip non-Turkish tweets
            if (tweet.lang && tweet.lang !== 'tr') {
              continue;
            }

            // Skip retweets
            if (tweet.text.startsWith('RT @')) {
              continue;
            }

            const post = {
              id: `twitter_${tweet.id}`,
              content: tweet.text,
              summary: generateSummary(tweet.text),
              platform: 'twitter' as const,
              date: new Date(tweet.created_at).toISOString().split('T')[0],
              time: new Date(tweet.created_at).toLocaleTimeString('tr-TR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              url: `https://twitter.com/${userInfo.username}/status/${tweet.id}`,
              engagement: {
                likes: tweet.public_metrics?.like_count || 0,
                shares: (tweet.public_metrics?.retweet_count || 0) + (tweet.public_metrics?.quote_count || 0),
                comments: tweet.public_metrics?.reply_count || 0
              },
              tags: extractTags(tweet.text, tweet.context_annotations),
              category: categorizeContent(tweet.text),
              author: {
                username: userInfo.username,
                name: userInfo.name,
                verified: userInfo.verified || false
              }
            };

            allPosts.push(post);
          }
        }
      } catch (error) {
        console.error(`Error processing ${username}:`, error);
      }
    }

    // Sort by date (newest first)
    allPosts.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());

    return new Response(JSON.stringify({
      success: true,
      data: allPosts,
      count: allPosts.length,
      lastUpdated: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error fetching Twitter data:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: []
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});

function generateSummary(text: string): string {
  // Remove URLs, mentions, and hashtags for summary
  const cleanText = text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/@\w+/g, '')
    .replace(/#\w+/g, '')
    .trim();

  const sentences = cleanText.split(/[.!?]+/);
  const firstSentence = sentences[0]?.trim();
  
  if (firstSentence && firstSentence.length > 20 && firstSentence.length <= 150) {
    return firstSentence + '.';
  }
  
  return cleanText.substring(0, 120) + '...';
}

function extractTags(text: string, contextAnnotations?: Array<{ domain: { name: string }; entity: { name: string } }>): string[] {
  const tags: string[] = [];
  
  // Extract hashtags
  const hashtags = text.match(/#[\wğüşıöçĞÜŞİÖÇ]+/g);
  if (hashtags) {
    tags.push(...hashtags.map(tag => tag.substring(1)));
  }

  // Add context from Twitter's annotations
  if (contextAnnotations) {
    contextAnnotations.forEach(annotation => {
      if (annotation.entity?.name) {
        tags.push(annotation.entity.name);
      }
    });
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
    'sosyal': ['Sosyal', 'Toplum'],
    'seçim': ['Seçim', 'Politika'],
    'cumhurbaşkanı': ['CB', 'Seçim'],
    'millet': ['Millet', 'Halk'],
    'demokrasi': ['Demokrasi', 'Özgürlük']
  };

  Object.entries(keywords).forEach(([keyword, relatedTags]) => {
    if (text.toLowerCase().includes(keyword)) {
      tags.push(...relatedTags);
    }
  });

  return [...new Set(tags)].slice(0, 8); // Remove duplicates and limit
}

function categorizeContent(text: string): string {
  const categories = {
    'Ulaşım': ['metro', 'otobüs', 'ulaşım', 'trafik', 'yol', 'köprü'],
    'Çevre': ['çevre', 'yeşil', 'park', 'ağaç', 'temiz', 'doğa'],
    'Kültür': ['kültür', 'sanat', 'müze', 'tiyatro', 'konser', 'festival'],
    'Spor': ['spor', 'stadyum', 'futbol', 'basketbol', 'olimpiyat', 'maç'],
    'Eğitim': ['eğitim', 'okul', 'üniversite', 'öğrenci', 'kurs', 'bilim'],
    'Ekonomi': ['ekonomi', 'iş', 'yatırım', 'ticaret', 'istihdam', 'gelir'],
    'Sosyal': ['sosyal', 'yardım', 'destek', 'hizmet', 'vatandaş', 'toplum'],
    'Politika': ['seçim', 'cumhurbaşkanı', 'millet', 'demokrasi', 'özgürlük', 'adalet'],
    'Sağlık': ['sağlık', 'hastane', 'doktor', 'tedavi', 'aşı', 'pandemi']
  };

  const lowerText = text.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return category;
    }
  }

  return 'Genel';
}