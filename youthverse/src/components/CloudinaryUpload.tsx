import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Image as ImageIcon, Trash, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary';

interface CloudinaryUploadProps {
  onUploadSuccess: (urls: string[]) => void;
  multiple?: boolean;
  value?: string[];
  label?: string;
}

export default function CloudinaryUpload({
  onUploadSuccess,
  multiple = false,
  value = [],
  label = 'Upload Image'
}: CloudinaryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];

    // Filter valid image files
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (validFiles.length === 0) {
      alert('Please upload image files only (PNG, JPG, WEBP, etc.)');
      setUploading(false);
      return;
    }

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const progressKey = `${file.name}-${i}`;
        setProgresses((prev) => ({ ...prev, [progressKey]: 0 }));

        const result = await uploadToCloudinary(file, (progress) => {
          setProgresses((prev) => ({ ...prev, [progressKey]: progress }));
        });

        newUrls.push(result.secure_url);
      }

      if (multiple) {
        onUploadSuccess([...value, ...newUrls]);
      } else {
        onUploadSuccess([newUrls[0]]);
      }
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      alert('Failed to upload image(s). Please check your connection and try again.');
    } finally {
      setUploading(false);
      setProgresses({});
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleRemove = (urlToRemove: string) => {
    onUploadSuccess(value.filter((u) => u !== urlToRemove));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Drag & Drop Main Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center text-center
          ${isDragging
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/25'
            : 'border-gray-300 dark:border-gray-700 hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          accept="image/*"
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center space-y-3 py-4">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Uploading image(s) to Cloudinary...
            </div>
            {Object.entries(progresses).map(([fileName, progress]) => (
              <div key={fileName} className="w-64">
                <div className="flex justify-between text-xs text-gray-500 mb-1 max-w-[240px] truncate">
                  <span>{fileName.split('-')[0]}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-full">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Drag & drop or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span> to upload
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supports JPG, PNG, WEBP, GIF (Max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Previews Grid */}
      {value.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Uploaded Photos ({value.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {value.map((url, i) => (
              <div
                key={url}
                className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100"
              >
                <img
                  src={url}
                  alt={`Upload preview ${i + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {/* Overlay index/number */}
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] text-white px-2 py-0.5 rounded-full font-bold">
                  #{i + 1}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(url);
                  }}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                >
                  <Trash className="h-5 w-5 text-red-400 hover:text-red-300 transform hover:scale-110 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
