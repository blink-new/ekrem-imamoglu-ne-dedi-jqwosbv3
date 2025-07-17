import { useState, useEffect, useCallback } from 'react'
import { Twitter, Instagram, Facebook, Youtube, Menu, Clock, ExternalLink, Loader2, TrendingUp, Calendar as CalendarIcon, Star } from 'lucide-react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet'
import { Skeleton } from './components/ui/skeleton'
import { Alert, AlertDescription } from './components/ui/alert'
import { AdvancedSearch, SearchFilters } from './components/AdvancedSearch'
import { socialMediaService, SocialMediaPost } from './services/socialMediaService'
import { useSEO, generateWebsiteStructuredData } from './hooks/useSEO'

const platformIcons = {
  twitter: Twitter,
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  rss: ExternalLink
}

const platformColors = {
  twitter: 'bg-blue-500',
  instagram: 'bg-pink-500',
  facebook: 'bg-blue-600',
  youtube: 'bg-red-500',
  rss: 'bg-gray-500'
}

const platformLabels = {
  twitter: 'Twitter',
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  rss: 'RSS'
}

function App() {
  const [allPosts, setAllPosts] = useState<SocialMediaPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<SocialMediaPost[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [popularTags, setPopularTags] = useState<string[]>([])
  const [daysSinceSilivri, setDaysSinceSilivri] = useState(0)

  // SEO optimization
  useSEO({
    title: 'Ekrem İmamoğlu Ne Dedi - Güncel Açıklamalar ve Sosyal Medya Takibi',
    description: 'Ekrem İmamoğlu\'nun sosyal medya hesaplarındaki güncel açıklamalarını takip edin. İstanbul Büyükşehir Belediye Başkanı\'nın son açıklamaları, özetleri ve analizleri.',
    keywords: 'Ekrem İmamoğlu, İstanbul Belediye Başkanı, sosyal medya, açıklamalar, güncel haberler, Twitter, Instagram, Facebook, YouTube, CB Adaylık Ofisi',
    ogTitle: 'Ekrem İmamoğlu Ne Dedi - Güncel Açıklamalar',
    ogDescription: 'İstanbul Büyükşehir Belediye Başkanı Ekrem İmamoğlu\'nun sosyal medya hesaplarındaki güncel açıklamalarını takip edin.',
    twitterTitle: 'Ekrem İmamoğlu Ne Dedi',
    twitterDescription: 'Güncel açıklamalar ve sosyal medya takibi',
    canonicalUrl: window.location.href,
    structuredData: generateWebsiteStructuredData()
  })

  // Load posts on component mount
  useEffect(() => {
    loadPosts()
  }, [])

  // Calculate days since Silivri and update every minute
  useEffect(() => {
    const calculateDays = () => {
      const startDate = new Date('2025-03-23')
      const today = new Date()
      const diffTime = Math.abs(today.getTime() - startDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysSinceSilivri(diffDays)
    }

    // Calculate immediately
    calculateDays()

    // Update every minute to ensure accuracy
    const interval = setInterval(calculateDays, 60000)

    return () => clearInterval(interval)
  }, [])

  const applySearchAndFilters = useCallback(() => {
    let filtered = allPosts

    // Apply search
    if (searchQuery.trim()) {
      filtered = socialMediaService.searchPosts(filtered, searchQuery)
    }

    // Apply filters
    filtered = socialMediaService.filterPosts(filtered, filters)

    setFilteredPosts(filtered)
  }, [allPosts, searchQuery, filters])

  // Apply search and filters when they change
  useEffect(() => {
    applySearchAndFilters()
  }, [applySearchAndFilters])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Gerçek Twitter verilerini yüklüyor...')
      const posts = await socialMediaService.getAllPosts()
      console.log(`✅ ${posts.length} gönderi yüklendi`)
      
      setAllPosts(posts)
      
      // Extract categories and popular tags
      const postCategories = socialMediaService.getCategories(posts)
      const postTags = socialMediaService.getPopularTags(posts, 30)
      
      setCategories(postCategories)
      setPopularTags(postTags)
      
    } catch (err) {
      setError('Gerçek Twitter verileri yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.')
      console.error('Error loading posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleFilter = (newFilters: SearchFilters) => {
    setFilters(newFilters)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatEngagement = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getTodaysPost = () => {
    const today = new Date().toISOString().split('T')[0]
    return filteredPosts.find(post => post.date === today) || filteredPosts[0]
  }

  const Navigation = () => (
    <nav className="flex items-center space-x-8">
      <a href="#home" className="text-foreground hover:text-primary transition-colors font-medium">
        Ana Sayfa
      </a>
      <a href="#statements" className="text-foreground hover:text-primary transition-colors font-medium">
        Güncel Açıklamalar
      </a>
      <a href="#archive" className="text-foreground hover:text-primary transition-colors font-medium">
        Arşiv
      </a>
    </nav>
  )

  const LoadingSkeleton = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-20 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-18" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-primary">
                Ekrem İmamoğlu Ne Dedi
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <Navigation />
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <div className="flex flex-col space-y-6 mt-6">
                  <a href="#home" className="text-lg font-medium hover:text-primary transition-colors">
                    Ana Sayfa
                  </a>
                  <a href="#statements" className="text-lg font-medium hover:text-primary transition-colors">
                    Güncel Açıklamalar
                  </a>
                  <a href="#archive" className="text-lg font-medium hover:text-primary transition-colors">
                    Arşiv
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-primary/5 to-accent/5 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 text-sm">
                🔴 CANLI • Twitter API v2 ile Gerçek Veriler
              </Badge>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground mb-6">
              Ekrem İmamoğlu
              <span className="block text-primary">Ne Dedi?</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              İstanbul Büyükşehir Belediye Başkanı Ekrem İmamoğlu'nun sosyal medya hesaplarındaki 
              güncel açıklamalarını takip edin. Gerçek zamanlı güncellemeler, nitelikli özetler ve detaylı analizlerle.
            </p>

            {/* Silivri Counter */}
            <div className="mb-8">
              <Card className="max-w-2xl mx-auto bg-gradient-to-r from-red-50 via-orange-50 to-yellow-50 border-red-200 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardContent className="py-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <h3 className="text-xl font-bold text-red-800">
                        Silivri'den Bu Yana
                      </h3>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="relative">
                      <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-red-700 to-red-800 mb-2 tracking-tight">
                        {daysSinceSilivri.toLocaleString('tr-TR')}
                      </div>
                      <div className="text-2xl font-bold text-red-600 mb-3 tracking-widest">
                        GÜN
                      </div>
                    </div>
                    <div className="bg-red-100 rounded-full px-4 py-2 inline-block">
                      <p className="text-sm font-medium text-red-800">
                        📅 23 Mart 2025'ten bugüne
                      </p>
                    </div>
                    <div className="mt-4 text-xs text-red-600 opacity-75">
                      Her dakika otomatik güncellenir
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Today's Highlight */}
            {!loading && filteredPosts.length > 0 && (() => {
              const todaysPost = getTodaysPost()
              return (
                <div className="mb-12">
                  <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Badge variant="default" className="bg-primary text-primary-foreground font-semibold">
                          <Star className="h-3 w-3 mr-1" />
                          BUGÜNÜN YORUMU
                        </Badge>
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <CardTitle className="text-2xl text-center text-primary">
                        {formatDate(todaysPost.date)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-center space-y-4">
                        <div className="bg-background/90 backdrop-blur-sm rounded-xl p-6 border border-primary/20 shadow-inner">
                          <h4 className="font-bold text-lg text-primary mb-4">
                            En Son Açıklama:
                          </h4>
                          <blockquote className="text-lg leading-relaxed text-foreground mb-4 italic border-l-4 border-primary pl-4">
                            "{todaysPost.summary}"
                          </blockquote>
                          <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {todaysPost.tags.slice(0, 4).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs bg-primary/5 border-primary/20">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-full ${platformColors[todaysPost.platform]}`}>
                                {(() => {
                                  const PlatformIcon = platformIcons[todaysPost.platform];
                                  return <PlatformIcon className="h-3 w-3 text-white" />;
                                })()}
                              </div>
                              <span className="font-medium">{platformLabels[todaysPost.platform]}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {todaysPost.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {formatEngagement(todaysPost.engagement.likes)} beğeni
                            </span>
                          </div>
                          {todaysPost.url && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="mt-4 border-primary/30 hover:bg-primary/10"
                              onClick={() => window.open(todaysPost.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3 mr-2" />
                              Orijinal Gönderiyi Gör
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })()}
            
            {/* Social Media Links */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => window.open('https://x.com/CBAdayOfisi', '_blank')}
              >
                <Twitter className="h-4 w-4 text-blue-500" />
                <span>CB Adaylık Ofisi</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300"
                onClick={() => window.open('https://x.com/imamoglu_int', '_blank')}
              >
                <Twitter className="h-4 w-4 text-blue-500" />
                <span>Int. Hesap</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 hover:bg-pink-50 hover:border-pink-300"
                onClick={() => window.open('https://www.instagram.com/ekremimamoglu', '_blank')}
              >
                <Instagram className="h-4 w-4 text-pink-500" />
                <span>Instagram</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-600"
                onClick={() => window.open('https://www.facebook.com/imamogluekrem', '_blank')}
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                <span>Facebook</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-500"
                onClick={() => window.open('https://www.youtube.com/channel/UCT0byua4qIz2wtrmnXoPK6w', '_blank')}
              >
                <Youtube className="h-4 w-4 text-red-500" />
                <span>YouTube</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-400"
                onClick={() => window.open('https://x.com/hashtag/ekremimamo%C4%9Flu', '_blank')}
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                <span>#ekremimamoglu</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Stats */}
            {!loading && allPosts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-8 text-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-semibold text-foreground">{allPosts.length}</span>
                  <span>Toplam Gönderi</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarIcon className="h-5 w-5" />
                  <span className="font-semibold text-foreground">
                    {new Set(allPosts.map(p => p.date)).size}
                  </span>
                  <span>Farklı Gün</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="font-semibold">
                    {categories.length} Kategori
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Advanced Search Section */}
      <section className="py-8 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdvancedSearch
            onSearch={handleSearch}
            onFilter={handleFilter}
            categories={categories}
            popularTags={popularTags}
            searchQuery={searchQuery}
            filters={filters}
          />
        </div>
      </section>

      {/* Statements Section */}
      <section id="statements" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <h3 className="text-3xl font-bold">Güncel Açıklamalar</h3>
            {!loading && (
              <Button 
                variant="outline" 
                onClick={loadPosts}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4" />
                Yenile
              </Button>
            )}
          </div>
          
          {error && (
            <Alert className="mb-8">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Aradığınız kriterlere uygun açıklama bulunamadı.'
                  : 'Henüz açıklama bulunamadı.'
                }
              </p>
              {(searchQuery || Object.keys(filters).length > 0) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('')
                    setFilters({})
                  }}
                >
                  Filtreleri Temizle
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 text-sm text-muted-foreground">
                {filteredPosts.length} açıklama gösteriliyor
                {allPosts.length !== filteredPosts.length && ` (${allPosts.length} toplam)`}
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => {
                  const PlatformIcon = platformIcons[post.platform]
                  return (
                    <Card key={post.id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-full ${platformColors[post.platform]}`}>
                              <PlatformIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {platformLabels[post.platform]}
                              </span>
                              {post.author && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  @{post.author.username}
                                  {post.author.verified && <span className="text-blue-500">✓</span>}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {post.time}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {formatDate(post.date)}
                          </CardTitle>
                          {post.category && (
                            <Badge variant="secondary" className="text-xs">
                              {post.category}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-sm text-primary mb-2">Özet:</h4>
                            <p className="text-sm text-muted-foreground">
                              {post.summary}
                            </p>
                          </div>
                          
                          <p className="text-sm leading-relaxed line-clamp-4">
                            {post.content}
                          </p>
                          
                          {post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs hover:bg-primary/10 cursor-pointer">
                                  #{tag}
                                </Badge>
                              ))}
                              {post.tags.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 4}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span>{formatEngagement(post.engagement.likes)} beğeni</span>
                            <span>{formatEngagement(post.engagement.shares)} paylaşım</span>
                            <span>{formatEngagement(post.engagement.comments)} yorum</span>
                          </div>

                          {post.url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full mt-2"
                              onClick={() => window.open(post.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Orijinal Gönderiyi Gör
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-4">Ekrem İmamoğlu Ne Dedi</h4>
            <p className="text-muted-foreground mb-6">
              İstanbul Büyükşehir Belediye Başkanı'nın güncel açıklamalarını gerçek zamanlı takip edin.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 hover:text-blue-500"
                onClick={() => window.open('https://x.com/CBAdayOfisi', '_blank')}
              >
                <Twitter className="h-4 w-4" />
                <span>CB Adaylık Ofisi</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 hover:text-blue-500"
                onClick={() => window.open('https://x.com/imamoglu_int', '_blank')}
              >
                <Twitter className="h-4 w-4" />
                <span>Int. Hesap</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 hover:text-pink-500"
                onClick={() => window.open('https://www.instagram.com/ekremimamoglu', '_blank')}
              >
                <Instagram className="h-4 w-4" />
                <span>Instagram</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 hover:text-blue-600"
                onClick={() => window.open('https://www.facebook.com/imamogluekrem', '_blank')}
              >
                <Facebook className="h-4 w-4" />
                <span>Facebook</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2 hover:text-red-500"
                onClick={() => window.open('https://www.youtube.com/channel/UCT0byua4qIz2wtrmnXoPK6w', '_blank')}
              >
                <Youtube className="h-4 w-4" />
                <span>YouTube</span>
              </Button>
            </div>
            <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
              <p>© 2024 Ekrem İmamoğlu Ne Dedi. Bu site bağımsız bir takip platformudur.</p>
              <p className="mt-2">
                <strong>🔴 CANLI VERİLER:</strong> Bu site Ekrem İmamoğlu'nun resmi sosyal medya hesaplarından 
                <strong> gerçek zamanlı Twitter API v2</strong> ve RSS beslemeleri kullanarak güncel gönderileri 
                otomatik olarak derlemektedir. Veriler 5 dakikada bir güncellenir.
              </p>
              <p className="mt-1 text-xs opacity-75">
                <strong>Twitter API v2:</strong> @CBAdayOfisi, @imamoglu_int | 
                <strong> RSS:</strong> Instagram (@ekremimamoglu), Facebook (@imamogluekrem), YouTube kanalı
              </p>
              <p className="mt-1 text-xs opacity-60">
                Son güncelleme: {new Date().toLocaleString('tr-TR')}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App