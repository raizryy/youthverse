import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Navigate } from 'react-router-dom';
import AdminContentList from '../components/AdminContentList';
import AdminContentForm from '../components/AdminContentForm';
import AdminChapterManager from '../components/AdminChapterManager';
import { ListPlus, LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';

interface ActiveChapterView {
  contentId: string;
  title: string;
  type: 'novel' | 'manga' | 'manhua' | 'manhwa';
}

export default function AdminDashboard() {
  const { isAdmin, isAuthReady } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [selectedContent, setSelectedContent] = useState<ActiveChapterView | null>(null);

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-gray-500 font-medium">Verifying Credentials...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-254/60 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Portal Control Panel
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            YouthVerse Official Administrator Suite
          </p>
        </div>

        {/* Action Toggle Tabs */}
        {!selectedContent && (
          <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200/50 dark:border-gray-754/30">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all
                ${activeTab === 'list'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600'
                }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Manage Projects
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all
                ${activeTab === 'create'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600'
                }`}
            >
              <PlusCircle className="h-4 w-4" /> Create Content
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Frame */}
      <div className="transition-all duration-300">
        {selectedContent ? (
          <AdminChapterManager
            contentId={selectedContent.contentId}
            contentTitle={selectedContent.title}
            contentType={selectedContent.type}
            onBack={() => setSelectedContent(null)}
          />
        ) : activeTab === 'list' ? (
          <AdminContentList
            onSelectChapters={(contentId, title, type) =>
              setSelectedContent({ contentId, title, type })
            }
          />
        ) : (
          <AdminContentForm onSuccess={() => setActiveTab('list')} />
        )}
      </div>
    </div>
  );
}
