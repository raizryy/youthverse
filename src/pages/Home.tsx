import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, ChevronRight, Tag, BookMarked, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  type: 'novel' | 'manga' | 'manhua' | 'manhwa';
  author: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  tags: string[];
  views: number;
}

export default function Home() {
  const { t } = useTranslation();
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'novel' | 'manga' | 'manhua' | 'manhwa'>('all');

  useEffect(() => {
    async function fetchContents() {
      try {
        const q = query(collection(db, 'contents'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ContentItem[];
        setContents(fetched);
      } catch (err) {
        console.error('Error fetching home contents:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchContents();
  }, []);

  const filteredContents = contents.filter(item => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Pick the first item as a Hero Banner block if any exist
  const heroItem = contents.length > 0 ? contents[0] : null;

  return (
    <div className="space-y-10">
      
      {/* 1. Hero Spotlight Section */}
      {heroItem && searchQuery === '' && activeFilter === 'all' && (
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 text-white shadow-xl aspect-[16/9] md:aspect-[21/9]">
          <div className="absolute inset-0 z-0">
            <img
              src={heroItem.coverImage}
              alt={heroItem.title}
              className="w-full h-full object-cover opacity-35 object-top md:object-center filter blur-[2px] scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-slate-950 via-slate-950/70 to-transparent"></div>
          </div>

          <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-12 md:max-w-xl space-y-4">
            <span className="inline-flex px-3 py-1 bg-indigo-600 border border-indigo-400 text-[10px] font-extrabold uppercase rounded-full tracking-widest w-fit">
              Spotlight #{heroItem.type}
            </span>
            <h2 className="text-2xl md:text-4xl font-black leading-tight text-white line-clamp-2">
              {heroItem.title}
            </h2>
            <p className="text-xs md:text-sm text-gray-300 line-clamp-3 leading-relaxed">
              {heroItem.description}
            </p>
            <div className="flex flex-wrap gap-1.5 pt-2">
              {heroItem.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[10px] bg-white/10 dark:bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold uppercase">
                  #{tag}
                </span>
              ))}
            </div>
            
            <Link
              to={`/content/${heroItem.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-indigo-50 text-slate-950 font-black rounded-xl text-sm transition-all shadow-md hover:shadow-lg w-fit mt-4"
            >
              Start Reading <ChevronRight className="h-4 w-4 text-indigo-600" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Unified Feed Headers & Actions */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <BookMarked className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              {t('home.trending')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Browse professional translation block editions
            </p>
          </div>

          {/* Search bar integration */}
          <div className="relative w-full md:max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('home.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-gray-700 dark:text-gray-200 shadow-sm"
            />
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* 3. Type Category Filter Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200/55 dark:border-gray-800">
          {[
            { id: 'all', label: t('home.allTypes') },
            { id: 'novel', label: t('home.novels') },
            { id: 'manga', label: t('home.mangas') },
            { id: 'manhua', label: t('home.manhuas') },
            { id: 'manhwa', label: t('home.manhwas') }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-4 py-1.5 text-xs font-black rounded-full border transition-all whitespace-nowrap uppercase tracking-wider
                ${activeFilter === filter.id
                  ? 'bg-indigo-600 text-white border-transparent shadow'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-500'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* 4. Display Listings Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredContents.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold">{t('home.noItems')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredContents.map(item => (
              <Link
                key={item.id}
                to={`/content/${item.id}`}
                className="group flex flex-col space-y-3 bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200/50 dark:border-gray-700/40 p-3 hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:shadow-md transition-all duration-300"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-inner">
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Form Tag Badge */}
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 bg-black/75 backdrop-blur text-[8px] font-black uppercase text-white rounded-full tracking-wider border border-white/10">
                    {item.type}
                  </span>
                  
                  {/* Status Overlay */}
                  <span className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-[8px] font-black uppercase border
                    ${item.status === 'ongoing'
                      ? 'bg-emerald-500/90 text-white border-transparent'
                      : item.status === 'completed'
                      ? 'bg-blue-500/90 text-white border-transparent'
                      : 'bg-amber-500/90 text-white border-transparent'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between space-y-1">
                  <div>
                    <h4 className="font-bold text-gray-950 dark:text-gray-50 text-xs sm:text-sm line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> {item.author}
                    </span>
                  </div>

                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 opacity-80">
                      {item.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[9px] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
