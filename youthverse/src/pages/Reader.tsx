import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ChevronLeft, ChevronRight, Settings2, Info, Moon, Sun, Type } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  type: 'novel' | 'manga' | 'manhua' | 'manhwa';
}

interface ChapterItem {
  id: string;
  chapterNumber: number;
  title: string;
  pages?: string[];
  textContent?: string;
}

export default function Reader() {
  const { contentId, chapterId } = useParams<{ contentId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [chapter, setChapter] = useState<ChapterItem | null>(null);
  const [allChapters, setAllChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState<number>(18); // default px
  const [theme, setTheme] = useState<'light' | 'warm' | 'dark'>('warm');

  useEffect(() => {
    if (!contentId || !chapterId) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Fetch Content Metadata
        const contentRef = doc(db, 'contents', contentId);
        const contentSnap = await getDoc(contentRef);
        if (!contentSnap.exists()) {
          navigate('/');
          return;
        }
        const contentData = { id: contentSnap.id, ...contentSnap.data() } as ContentItem;
        setContent(contentData);

        // Fetch Current Chapter
        const chapterRef = doc(db, 'contents', contentId, 'chapters', chapterId);
        const chapterSnap = await getDoc(chapterRef);
        if (!chapterSnap.exists()) {
          alert('This chapter is currently unavailable.');
          navigate(`/content/${contentId}`);
          return;
        }
        setChapter({ id: chapterSnap.id, ...chapterSnap.data() } as ChapterItem);

        // Fetch All Chapters for context navigation
        const chaptersRef = collection(db, 'contents', contentId, 'chapters');
        const q = query(chaptersRef, orderBy('chapterNumber', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChapterItem[];
        setAllChapters(fetchedList);

      } catch (err) {
        console.error('Error fetching reader context:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [contentId, chapterId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium">Rendering engine panels...</p>
      </div>
    );
  }

  if (!content || !chapter) return null;

  // Navigation handlers
  const currentIndex = allChapters.findIndex(c => c.id === chapter.id);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const navigateToChapter = (idToNavigate: string) => {
    navigate(`/read/${contentId}/chapter/${idToNavigate}`);
    // Scroll window smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dynamic values based on reader preferences
  const themeClasses = {
    light: 'bg-white text-gray-900 border-gray-200',
    warm: 'bg-[#F9F3EB] text-[#423C35] border-[#E8DFC2]',
    dark: 'bg-[#0E0E10] text-[#D1D1D6] border-zinc-800'
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${theme === 'dark' ? 'dark' : ''}`}>
      
      {/* Dynamic Reading Wrapper Container */}
      <div className={`max-w-3xl mx-auto rounded-2xl border p-4 sm:p-8 md:p-12 shadow-sm transition-all ${themeClasses[theme]}`}>
        
        {/* Navigation Action Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-8 border-current/10">
          <Link
            to={`/content/${contentId}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-4 w-4" /> {t('reader.backToDetail')}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all"
              title={t('reader.settings')}
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Floating Settings Console Drawer */}
        {showSettings && (
          <div className="mb-8 p-6 rounded-xl border border-current/15 bg-black/5 dark:bg-white/5 space-y-4 animate-fadeIn">
            <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-indigo-500" />
              {t('reader.settings')}
            </h4>

            {/* Font Size controls (only for novels, hide for manga) */}
            {content.type === 'novel' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-semibold flex items-center gap-1.5 task-list-item">
                  <Type className="h-4 w-4" /> {t('reader.fontSize')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontSize(Math.max(12, fontSize - 1))}
                    className="px-3 py-1 bg-black/15 dark:bg-white/15 hover:bg-black/25 font-bold rounded"
                  >
                    A-
                  </button>
                  <span className="text-xs font-bold px-2">{fontSize}px</span>
                  <button
                    onClick={() => setFontSize(Math.min(32, fontSize + 1))}
                    className="px-3 py-1 bg-black/15 dark:bg-white/15 hover:bg-black/25 font-bold rounded"
                  >
                    A+
                  </button>
                </div>
              </div>
            )}

            {/* Backgound Preference settings */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-current/5">
              <span className="text-xs font-semibold">{t('reader.theme')}</span>
              <div className="flex gap-2">
                {[
                  { id: 'light', label: t('reader.themeLight'), bg: 'bg-white text-gray-900 border-gray-300' },
                  { id: 'warm', label: t('reader.themeWarm'), bg: 'bg-[#F9F3EB] text-[#423C35] border-[#E8DFC2]' },
                  { id: 'dark', label: t('reader.themeDark'), bg: 'bg-[#0E0E10] text-[#D1D1D6] border-zinc-800' }
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => setTheme(th.id as any)}
                    className={`px-3 py-1 text-[10px] font-bold rounded border uppercase transition-all
                      ${theme === th.id
                        ? 'ring-2 ring-indigo-500'
                        : 'opacity-75 hover:opacity-100'
                      } ${th.bg}`}
                  >
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Headings */}
        <div className="space-y-2 text-center mb-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-[#6366F1]">
            Chapter {chapter.chapterNumber}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            {chapter.title || `Chapter ${chapter.chapterNumber}`}
          </h2>
        </div>

        {/* Core Media Display Screen */}
        <div className="pt-6 pb-12 border-b border-current/10">
          {content.type === 'novel' ? (
            /* Story Text display for novels */
            <div
              className="font-sans leading-relaxed whitespace-pre-line break-words space-y-4 select-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {chapter.textContent}
            </div>
          ) : (
            /* Image stream panel rendering for comic types */
            <div className="space-y-4 max-w-2xl mx-auto flex flex-col items-center">
              {chapter.pages && chapter.pages.length > 0 ? (
                chapter.pages.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`${chapter.title} Page ${idx + 1}`}
                    className="w-full h-auto object-contain shadow-sm rounded-lg"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ))
              ) : (
                <div className="text-center py-20 text-gray-500 font-medium">
                  🖼️ No images loaded in this manga chapter.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigations Footer Buttons */}
        <div className="flex items-center justify-between gap-4 pt-10">
          <button
            onClick={() => prevChapter && navigateToChapter(prevChapter.id)}
            disabled={!prevChapter}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 disabled:opacity-30 disabled:hover:bg-transparent font-bold text-xs uppercase tracking-wider rounded-xl transition-all"
          >
            <ChevronLeft className="h-4 w-4" /> {t('reader.prev')}
          </button>

          <button
            onClick={() => nextChapter && navigateToChapter(nextChapter.id)}
            disabled={!nextChapter}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shadow-indigo-600/10"
          >
            {t('reader.next')} <ChevronRight className="h-4 w-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
