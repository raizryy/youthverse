import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Loader2, BookOpen, Trash, Settings, Eye, MessageSquare, Tag } from 'lucide-react';

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
  createdAt: any;
}

interface AdminContentListProps {
  onSelectChapters: (contentId: string, title: string, type: 'novel' | 'manga' | 'manhua' | 'manhwa') => void;
}

export default function AdminContentList({ onSelectChapters }: AdminContentListProps) {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'contents'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedContents = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ContentItem[];
        setContents(loadedContents);
        setLoading(false);
      },
      (error) => {
        console.error('Snapshot reading failed:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Warning: Deleting this item will NOT automatically delete its chapters. Please delete chapters from Chapter Management first. Continue deleting this main entry?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'contents', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `/contents/${id}`);
    }
  };

  const filteredContents = contents.filter((item) => {
    const matchesFilter = filterType === 'all' || item.type === filterType;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Filters Board */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by title, author..."
          className="w-full sm:max-w-xs px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />

        <div className="flex gap-2">
          {['all', 'novel', 'manga', 'manhua', 'manhwa'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1 text-xs font-bold rounded-full border transition-all uppercase tracking-wider
                ${filterType === type
                  ? 'bg-indigo-600 text-white border-transparent shadow'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-754 hover:border-indigo-400'
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        </div>
      ) : filteredContents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No projects found. Create your first ever project above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((item) => (
            <div
              key={item.id}
              className="flex flex-col bg-white dark:bg-gray-800 border border-gray-254 dark:border-gray-700/60 rounded-xl overflow-hidden hover:shadow-lg hover:border-indigo-400/50 transition-all transition-shadow duration-300"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 dark:bg-gray-900">
                <img
                  src={item.coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                
                {/* Badge of Type */}
                <span className="absolute top-3 left-3 px-3 py-1 bg-black/70 backdrop-blur text-white text-[10px] font-black uppercase rounded-full tracking-widest border border-white/20">
                  {item.type}
                </span>

                {/* Status Badge */}
                <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border
                  ${item.status === 'ongoing'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : item.status === 'completed'
                    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">By {item.author}</span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {item.description}
                  </p>
                  
                  {/* Tags */}
                  {item.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-semibold border border-slate-200/40 dark:border-slate-700/60">
                          <Tag className="h-2 w-2" /> {tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400 font-semibold">+{item.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700/80">
                  <button
                    onClick={() => onSelectChapters(item.id, item.title, item.type)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg transition-colors border border-indigo-100 dark:border-indigo-900/60"
                  >
                    <Settings className="h-3.5 w-3.5" /> Chapters
                  </button>

                  <button
                    onClick={() => handleDeleteContent(item.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-red-200"
                    title="Delete Entry"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
