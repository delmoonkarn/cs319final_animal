// "กระดานความสุขหลังได้บ้าน" on an adopted animal's page: the real success-story updates from the
// database, and a form for the animal's owner (the user whose adoption request was approved) or an admin.
import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ImagePlus, Loader2, Send, Trash2, X } from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { authHeaders, errorMessage, formatDateTime, uploadImages, type ImageDto } from '../lib/admin-api';

/** One update in GET /animals/:id → updates */
export type StoryUpdate = {
  id: number;
  caption: string;
  createdAt: string;
  images: ImageDto[];
  author: { id: number; name: string; role: 'USER' | 'ADMIN' };
};

type MyRequest = { id: number; status: 'PENDING' | 'APPROVED' | 'REJECTED'; animal: { id: number } };

const MAX_PHOTOS = 4;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function SuccessStories({ animalId, animalName, updates }: { animalId: number; animalName: string; updates: StoryUpdate[] }) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'ADMIN';

  // The owner = the user whose request for this animal was approved.
  const myRequests = useQuery({
    queryKey: ['my-adoption-requests', user?.id],
    queryFn: async () => (await api.get<MyRequest[]>('/adoption-requests/me', { headers: authHeaders() })).data,
    enabled: Boolean(user) && !isAdmin,
  });
  const isOwner = Boolean(myRequests.data?.some((r) => r.animal.id === animalId && r.status === 'APPROVED'));
  const canPost = isAdmin || isOwner;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['animal'] });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/animal-updates/${id}`, { headers: authHeaders() }),
    onSuccess: refresh,
  });

  const newestFirst = [...updates].reverse();

  return (
    <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
      <h2 className="text-xl font-extrabold text-[#3D312E] mb-6 flex items-center gap-2">
        <Heart size={24} className="text-pink-500 fill-pink-500" /> กระดานความสุขหลังได้บ้าน
      </h2>

      {canPost && <StoryForm animalId={animalId} animalName={animalName} isOwner={isOwner} onPosted={refresh} />}

      {newestFirst.length === 0 ? (
        <div className="rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 py-10 text-center text-gray-400 text-sm font-bold">
          {canPost ? 'ยังไม่มีอัปเดต · โพสต์เรื่องราวแรกของน้องได้เลย' : 'รออัปเดตจากบ้านใหม่ของน้อง...'}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {newestFirst.map((story) => {
            const canDelete = isAdmin || story.author.id === user?.id;
            return (
              <article key={story.id} className="rounded-[1.75rem] border border-gray-100 bg-[#FFFBF7] p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="text-xs font-bold text-gray-400">
                    <span className="text-[#3D312E]">{story.author.role === 'ADMIN' ? 'ทีมงาน PawHome' : story.author.name}</span>
                    {' · '}
                    {formatDateTime(story.createdAt)}
                  </div>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => window.confirm('ลบอัปเดตนี้? รูปภาพจะถูกลบด้วย') && remove.mutate(story.id)}
                      disabled={remove.isPending}
                      aria-label="ลบอัปเดต"
                      className="text-gray-300 hover:text-red-500 transition cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700 whitespace-pre-line leading-relaxed mb-3">{story.caption}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {story.images.map((image, i) => (
                    <a key={image.url} href={image.url} target="_blank" rel="noreferrer" className="h-36 rounded-2xl overflow-hidden bg-gray-100 block">
                      <img src={image.thumbUrl} alt={`อัปเดตของน้อง${animalName} รูปที่ ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {remove.isError && <p className="text-xs font-bold text-red-500 mt-3">{errorMessage(remove.error, 'ลบอัปเดตไม่สำเร็จ')}</p>}
    </div>
  );
}

/** Caption + 1–4 photos → POST /animal-updates */
function StoryForm({ animalId, animalName, isOwner, onPosted }: { animalId: number; animalName: string; isOwner: boolean; onPosted: () => void }) {
  const [caption, setCaption] = useState('');
  const [photos, setPhotos] = useState<ImageDto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const post = useMutation({
    mutationFn: () =>
      api.post('/animal-updates', { animalId, caption: caption.trim(), imageUrls: photos.map((p) => p.url) }, { headers: authHeaders() }),
    onSuccess: () => {
      setCaption('');
      setPhotos([]);
      setError('');
      onPosted();
    },
    onError: (e) => setError(errorMessage(e, 'โพสต์อัปเดตไม่สำเร็จ')),
  });

  const pickPhotos = async (files: FileList | null) => {
    // Copy the files first: clearing the input empties this same FileList.
    const list = files ? [...files] : [];
    if (fileInput.current) fileInput.current.value = '';
    if (list.length === 0) return;
    if (list.some((f) => !IMAGE_TYPES.includes(f.type))) return setError('รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP');
    if (list.some((f) => f.size > 5 * 1024 * 1024)) return setError('แต่ละรูปต้องไม่เกิน 5 MB');
    if (photos.length + list.length > MAX_PHOTOS) return setError(`แนบรูปได้สูงสุด ${MAX_PHOTOS} รูป`);
    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadImages(list);
      setPhotos((current) => [...current, ...uploaded].slice(0, MAX_PHOTOS));
    } catch (e) {
      setError(errorMessage(e, 'อัปโหลดรูปไม่สำเร็จ'));
    } finally {
      setUploading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return setError('กรุณาเขียนเรื่องราวสั้น ๆ ของน้อง');
    if (photos.length === 0) return setError('กรุณาแนบรูปอย่างน้อย 1 รูป');
    post.mutate();
  };

  return (
    <form onSubmit={submit} className="rounded-[1.75rem] border border-orange-100 bg-[#FFF8F1] p-5 mb-6">
      <div className="text-sm font-extrabold text-[#3D312E] mb-2">
        {isOwner ? `อัปเดตชีวิตใหม่ของน้อง${animalName}` : 'โพสต์อัปเดต (แอดมิน)'}
      </div>
      <textarea
        rows={3}
        maxLength={1000}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder={`วันนี้น้อง${animalName}เป็นอย่างไรบ้าง...`}
        className="w-full border border-[#EADBCB] bg-white rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition resize-y"
      />
      <div className="flex flex-wrap items-center gap-2 mt-3">
        {photos.map((photo) => (
          <div key={photo.url} className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
            <img src={photo.thumbUrl} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setPhotos((current) => current.filter((p) => p.url !== photo.url))}
              aria-label="เอารูปนี้ออก"
              className="absolute top-0.5 right-0.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 cursor-pointer"
            >
              <X size={11} />
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="w-16 h-16 rounded-xl border-2 border-dashed border-orange-200 bg-white text-orange-500 flex items-center justify-center hover:bg-orange-50 cursor-pointer disabled:opacity-60"
            aria-label="แนบรูป"
          >
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={20} />}
          </button>
        )}
        <input ref={fileInput} type="file" accept={IMAGE_TYPES.join(',')} multiple hidden onChange={(e) => pickPhotos(e.target.files)} />
        <button
          type="submit"
          disabled={post.isPending || uploading}
          className="ml-auto inline-flex items-center gap-1.5 bg-[#F37021] hover:bg-[#E06015] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-sm transition cursor-pointer disabled:opacity-60"
        >
          {post.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} โพสต์อัปเดต
        </button>
      </div>
      {error && <p role="alert" className="text-xs font-bold text-red-500 mt-2">{error}</p>}
    </form>
  );
}
