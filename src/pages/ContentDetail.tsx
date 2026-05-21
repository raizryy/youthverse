import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Bookmark, Tag, User, BookOpen, Clock, ArrowLeft } from 'lucide-react';

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

interface ChapterItem {
  id: string;
  chapterNumber: number;
  title: string;
}

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    async function fetchData() {
      try {
        const contentRef = doc(db, 'contents', id);
        const contentSnap = await getDoc(contentRef);
        
        if (!contentSnap.exists()) {
          alert('This content item does not exist.');
          navigate('/');
          return;
        }

        setContent({ id: contentSnap.id, ...contentSnap.data() } as ContentItem);

        // Fetch subcollection chapters matching this content
        const chaptersRef = collection(db, 'contents', id, 'chapters');
        const q = query(chaptersRef, orderBy('chapterNumber', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedChapters = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChapterItem[];

        setChapters(fetchedChapters);
      } catch (err) {
        console.error('Error fetching detail coordinates:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium">Assembling details...</p>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      
      {/* Top back actions bar */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> {t('detail.back')}
      </Link>

      {/* Main Metadata Spotlight */}
      <div className="flex flex-col md:flex-row gap-8 items-start bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/60 shadow-sm">
        <div className="w-full md:w-56 aspect-[3/4] shrink-0 rounded-xl overflow-hidden shadow bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <img
            src={content.coverImage}
            alt={content.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-950 dark:text-white leading-tight">
              {content.title}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5 mt-1.5">
              <User className="h-4 w-4 text-indigo-500" /> By {content.author}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 max-w-sm">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                {t('detail.type')}
              </span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5 block">
                {content.type}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                {t('detail.status')}
              </span>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-300 uppercase tracking-widest mt-0.5 block">
                {content.status}
              </span>
            </div>
          </div>

          {/* Synopsis text area */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
              {t('detail.synopsis')}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-sans whitespace-pre-line">
              {content.description}
            </p>
          </div>

          {/* Tags */}
          {content.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {content.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 py-1 px-2.5 rounded-full font-bold uppercase text-slate-600 dark:text-slate-350"
                >
                  <Tag className="h-2.5 w-2.5" /> #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Start CTA Button */}
          {chapters.length > 0 && (
            <div className="pt-4">
              <Link
                to={`/read/${content.id}/chapter/${chapters[0].id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4" /> {t('detail.readNow')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Chapters directory */}
      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl border border-gray-200/50 dark:border-gray-700/60 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2 mb-6 border-b border-gray-150 dark:border-gray-700 pb-3">
          <Clock className="h-5 w-5 text-indigo-500" />
          {t('detail.chapters')} ({chapters.length})
        </h3>

        {chapters.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400 font-medium">
            🌵 {t('detail.emptyChapters')}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {chapters.map((chap) => (
              <Link
                key={chap.id}
                to={`/read/${content.id}/chapter/${chap.id}`}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-indigo-50/50 dark:bg-gray-900 dark:hover:bg-gray-850 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:-translate-y-0.5 duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center rounded-lg font-black text-xs text-indigo-600 dark:text-indigo-400 shadow-sm">
                    {chap.chapterNumber}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-gray-950 dark:text-gray-50 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {chap.title || `Chapter ${chap.chapterNumber}`}
                    </h5>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">
                      Chapter {chap.chapterNumber}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
