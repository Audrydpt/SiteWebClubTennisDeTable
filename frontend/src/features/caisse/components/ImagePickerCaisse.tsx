import { useState, useEffect } from 'react';
import type { Image } from '@/services/type';
import { fetchImagesCaisse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { X, ImageIcon } from 'lucide-react';

interface ImagePickerCaisseProps {
  value: string;
  onChange: (url: string) => void;
}

export default function ImagePickerCaisse({
  value,
  onChange,
}: ImagePickerCaisseProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && images.length === 0) {
      setLoading(true);
      fetchImagesCaisse()
        .then(setImages)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, images.length]);

  const selectedImage = images.find((img) => img.url === value);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-11 px-3 bg-[#4A4A4A] rounded-xl cursor-pointer hover:bg-[#555] transition-colors"
      >
        {value ? (
          <>
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#3A3A3A] shrink-0">
              <img
                src={value}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-white text-sm truncate flex-1">
              {selectedImage?.label || 'Image'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="h-6 w-6 text-gray-500 hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <>
            <ImageIcon className="w-4 h-4 text-gray-500" />
            <span className="text-gray-500 text-sm">Choisir une image</span>
          </>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-80 bg-[#3A3A3A] border border-[#555] rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-gray-500 text-sm text-center">
              Chargement...
            </div>
          ) : images.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm text-center">
              Aucune image dans le dossier Caisse.
              <br />
              <span className="text-xs">
                Uploadez des images via Media &gt; Dossier Caisse
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => {
                    onChange(img.url);
                    setIsOpen(false);
                  }}
                  className={`rounded-lg overflow-hidden border-2 transition-all ${
                    value === img.url
                      ? 'border-[#F1C40F] shadow-lg'
                      : 'border-transparent hover:border-gray-500'
                  }`}
                >
                  <div className="aspect-square bg-[#4A4A4A]">
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-1 bg-[#4A4A4A]">
                    <p className="text-[10px] text-gray-400 truncate">
                      {img.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
