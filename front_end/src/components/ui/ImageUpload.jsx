import { useState, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

/**
 * Composant d'upload d'images vers l'API REST /upload (remplace Firebase Storage).
 *
 * Props:
 *   folder    — dossier de destination (ex: "products", "delivery-proofs")
 *   value     — URL actuelle (string) ou liste d'URLs (string[])
 *   onChange  — callback(urls: string[]) appelé après upload
 *   multiple  — autoriser plusieurs images (défaut: false)
 *   accept    — types acceptés (défaut: "image/*")
 */
export default function ImageUpload({
  folder = 'uploads',
  value,
  onChange,
  multiple = false,
  accept = 'image/*',
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const existingUrls = Array.isArray(value) ? value : value ? [value] : [];

  const handleFiles = async (files) => {
    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const fileList = Array.from(files);
      const newUrls = [];

      for (let i = 0; i < fileList.length; i++) {
        const formData = new FormData();
        formData.append('file', fileList[i]);
        formData.append('folder', folder);

        const token = localStorage.getItem('syligogo_token') ?? '';
        const response = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error ?? `Erreur HTTP ${response.status}`);
        }

        const data = await response.json();
        newUrls.push(data.url);
        setProgress(Math.round(((i + 1) / fileList.length) * 100));
      }

      const result = multiple ? [...existingUrls, ...newUrls] : newUrls;
      onChange?.(result);
    } catch (err) {
      setError("Erreur lors de l'upload : " + err.message);
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (url) => {
    try {
      await fetch(`${API_URL}/upload`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch {
      // Ignorer si le fichier n'existe plus
    }
    onChange?.(existingUrls.filter((u) => u !== url));
  };

  return (
    <div className="space-y-3">
      {/* Prévisualisation */}
      {existingUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {existingUrls.map((url) => (
            <div key={url} className="relative group w-24 h-24">
              <img
                src={url}
                alt="upload"
                className="w-full h-full object-cover rounded-lg border border-gray-700"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute top-1 right-1 bg-red-900 text-red-300 rounded-full w-5 h-5 text-xs
                           flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Zone de sélection */}
      <div
        className="border-2 border-dashed border-gray-700 rounded-lg p-4 text-center cursor-pointer
                   hover:border-primary transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <div className="space-y-1">
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-400">Upload en cours… {progress}%</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            📷 Cliquer pour {multiple ? 'ajouter des images' : 'choisir une image'}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
        disabled={uploading}
      />

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
