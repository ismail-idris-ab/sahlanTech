import { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { uploadImage } from '../../services/upload.service';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUploader({ value, onChange, folder = 'courses' }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    setError('');
    if (!ALLOWED.includes(file.type)) {
      setError('Only JPEG, PNG, or WebP allowed.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('File must be under 5MB.');
      return;
    }
    setUploading(true);
    try {
      const result = await uploadImage(file, folder);
      onChange(result);
    } catch {
      setError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {value?.url ? (
        <div className="relative rounded-lg overflow-hidden border border-ink-300">
          <img src={value.url} alt="Cover" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-white/90 rounded-full p-1 hover:bg-white transition"
          >
            <X size={16} className="text-ink-900" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-ink-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-brand-primary hover:bg-surface-100 transition"
        >
          {uploading ? (
            <span className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={24} className="text-ink-500 mb-2" />
              <p className="text-sm text-ink-500">Click or drag to upload</p>
              <p className="text-xs text-ink-500 mt-1">JPEG, PNG, WebP — max 5MB</p>
            </>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
      />
      {error && <p className="text-brand-danger text-xs">{error}</p>}
    </div>
  );
}
