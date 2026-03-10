import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { LIST_PRODUCTS } from '../../graphql/queries/index.js';
import { MODERATE_PRODUCT, UPDATE_PRODUCT } from '../../graphql/mutations/index.js';
import Badge from '../../components/ui/Badge.jsx';
import ImageUpload from '../../components/ui/ImageUpload.jsx';

const fmt = (n) => new Intl.NumberFormat('fr-GN', { style: 'currency', currency: 'GNF', maximumFractionDigits: 0 }).format(n);

function ImageGallery({ urls, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);

  if (!urls?.length) return (
    <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-sm">
      Aucune image
    </div>
  );

  return (
    <>
      {/* Vignette principale cliquable */}
      <div className="relative group cursor-pointer" onClick={() => setOpen(true)}>
        <img src={urls[0]} alt="produit" className="w-full h-32 object-cover rounded-lg" />
        {urls.length > 1 && (
          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
            +{urls.length - 1} photo{urls.length > 2 ? 's' : ''}
          </span>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 rounded-lg transition flex items-center justify-center">
          <span className="text-white text-xs font-medium">Voir toutes</span>
        </div>
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 gap-4"
          onClick={() => setOpen(false)}
        >
          <img
            src={urls[idx]}
            alt="produit"
            className="max-h-[70vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {/* Miniatures */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {urls.map((u, i) => (
              <img
                key={u}
                src={u}
                alt=""
                className={`w-12 h-12 object-cover rounded-lg cursor-pointer border-2 transition ${
                  i === idx ? 'border-primary' : 'border-transparent opacity-60'
                }`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
          {onUpdate && (
            <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <ImageUpload
                folder="products"
                value={urls}
                onChange={onUpdate}
                multiple
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default function ProductsPage() {
  const [statusFilter, setStatusFilter] = useState('PENDING_REVIEW');
  const [rejectNote, setRejectNote] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  const { data, loading, refetch } = useQuery(LIST_PRODUCTS, {
    variables: { filters: { status: statusFilter || undefined, limit: 100 } },
  });

  const [moderate] = useMutation(MODERATE_PRODUCT, {
    onCompleted: () => { refetch(); setRejectingId(null); },
  });
  const [updateProduct] = useMutation(UPDATE_PRODUCT, { onCompleted: () => refetch() });

  const approve = (id) => moderate({ variables: { id, status: 'APPROVED' } });
  const reject = (id) => moderate({ variables: { id, status: 'REJECTED', rejectionNote: rejectNote } });
  const handleImagesUpdate = (productId, imageUrls) =>
    updateProduct({ variables: { id: productId, input: { imageUrls } } });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Modération des Produits</h2>

      <select className="input w-52" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">Tous</option>
        <option value="PENDING_REVIEW">En révision</option>
        <option value="APPROVED">Approuvés</option>
        <option value="REJECTED">Rejetés</option>
      </select>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="text-gray-500 col-span-3 py-8 text-center">Chargement...</p>}
        {!loading && data?.products.length === 0 && (
          <p className="text-gray-500 col-span-3 py-8 text-center">Aucun produit dans cette catégorie</p>
        )}

        {data?.products.map(product => (
          <div key={product.id} className="card space-y-3">
            <ImageGallery
              urls={product.imageUrls}
              onUpdate={(urls) => handleImagesUpdate(product.id, urls)}
            />

            <div className="flex justify-between items-start">
              <div className="min-w-0 pr-2">
                <h4 className="font-semibold truncate">{product.name}</h4>
                <p className="text-xs text-gray-400">{product.vendor.businessName}</p>
              </div>
              <Badge status={product.status} />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-green-400 font-medium">{fmt(product.price)}</span>
              <span className="text-gray-400">Stock : {product.stock}</span>
            </div>
            <p className="text-xs text-gray-500">{product.category}</p>

            {product.status === 'PENDING_REVIEW' && (
              <div className="space-y-2">
                {rejectingId === product.id ? (
                  <div className="space-y-2">
                    <input
                      className="input text-sm"
                      placeholder="Motif de refus..."
                      value={rejectNote}
                      onChange={(e) => setRejectNote(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => reject(product.id)} className="btn-primary text-sm flex-1">
                        Confirmer
                      </button>
                      <button onClick={() => setRejectingId(null)} className="btn-secondary text-sm">
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => approve(product.id)} className="btn-primary text-sm flex-1">
                      Approuver
                    </button>
                    <button
                      onClick={() => { setRejectingId(product.id); setRejectNote(''); }}
                      className="bg-red-900 text-red-300 px-3 py-2 rounded-lg text-sm hover:bg-red-800"
                    >
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            )}

            {product.rejectionNote && (
              <p className="text-xs text-red-400">Motif : {product.rejectionNote}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
