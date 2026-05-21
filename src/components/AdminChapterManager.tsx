import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Loader2, Plus, Trash, ArrowLeft, BookOpen, FileText, Check } from 'lucide-react';
import CloudinaryUpload from './CloudinaryUpload';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pages?: string[];
  textContent?: string;
  createdAt: any;
}

interface AdminChapterManagerProps {
  contentId: string;
  contentTitle: string;
  contentType: 'novel' | 'manga' | 'manhua' | 'manhwa';
  onBack: () => void;
}

export default function AdminChapterManager({
  contentId,
  contentTitle,
  contentType,
  onBack
}: AdminChapterManagerProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [pages, setPages] = useState<string[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'contents', contentId, 'chapters'),
      orderBy('chapterNumber', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedChapters = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Chapter[];
        setChapters(loadedChapters);
        
        // Suggest next chapter number
        if (loadedChapters.length > 0) {
          const maxNum = Math.max(...loadedChapters.map((c) => c.chapterNumber));
          setChapterNumber(maxNum + 1);
        } else {
          setChapterNumber(1);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Snapshot reading chapters failed:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [contentId]);

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you absolutely sure you want to delete this chapter? This cannot be undone!')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'contents', contentId, 'chapters', chapterId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `/contents/${contentId}/chapters/${chapterId}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (contentType === 'novel' && !textContent.trim()) {
      alert('Chapter text content cannot be blank!');
      return;
    }

    if (contentType !== 'novel' && pages.length === 0) {
      alert('Please upload at least one page scan/photo!');
      return;
    }

    setSubmitting(true);
    try {
      const chapterData: Partial<Chapter> & { createdAt: any; contentId: string } = {
        contentId,
        chapterNumber,
        title: title.trim(),
        createdAt: serverTimestamp(),
      };

      if (contentType === 'novel') {
        chapterData.textContent = textContent;
      } else {
        chapterData.pages = pages;
      }

      const colRef = collection(db, 'contents', contentId, 'chapters');
      await addDoc(colRef, chapterData);

      // Reset Form State
      setTitle('');
      setTextContent('');
      setPages([]);
      // increment next number automatically
      setChapterNumber(prev => prev + 1);

      alert('Chapter uploaded successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `/contents/${contentId}/chapters`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-sm transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Content List
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Existing Chapters List */}
        <div className="flex-1 space-y-4">
          <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Chapters for "{contentTitle}"
            </h2>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-4">
              Type: {contentType}
            </p>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            ) : chapters.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                🚀 No chapters added yet. Use the upload board on the right to publish Chapter 1!
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {chapters.map((chap) => (
                  <div
                    key={chap.id}
                    className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Ch {chap.chapterNumber}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                          {chap.title || `Chapter ${chap.chapterNumber}`}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {contentType === 'novel'
                            ? `${chap.textContent?.split(/\s+/).length || 0} words`
                            : `${chap.pages?.length || 0} illustrations`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteChapter(chap.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded transition-colors"
                      title="Delete Chapter"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chapter Upload Panel */}
        <div className="w-full lg:w-[450px] shrink-0">
          <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-3">
              Upload New Chapter
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  Number
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
                  Chapter Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Awakening the system"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {contentType === 'novel' ? (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between">
                  <span>Story Content</span>
                  <span className="text-[10px] text-gray-400 font-normal">Supports standard text breaks.</span>
                </label>
                <textarea
                  required
                  rows={14}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Start writing the story draft or paste your transcript here..."
                  className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans text-sm leading-relaxed"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <CloudinaryUpload
                  label="Chapter Pages (Manga Artwork)"
                  multiple={true}
                  onUploadSuccess={setPages}
                  value={pages}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Publishing...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" /> Publish Chapter {chapterNumber}
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
