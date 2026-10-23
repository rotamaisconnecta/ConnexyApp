import { UploadMedia } from "@/components/upload";
import type { MediaFile } from "@/lib/upload";
import { readFileAsDataURL } from "@/lib/upload";

export async function mediaToDataUrls(files: MediaFile[], limit = 4): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files.slice(0, limit)) {
    if (!file.file.type.startsWith("image/")) continue;
    urls.push(await readFileAsDataURL(file.file));
  }
  return urls;
}

export function CatalogImageFields({
  cover,
  gallery,
  onCoverChange,
  onGalleryChange,
  coverLabel,
  galleryLabel,
}: {
  cover: MediaFile[];
  gallery: MediaFile[];
  onCoverChange: (files: MediaFile[]) => void;
  onGalleryChange: (files: MediaFile[]) => void;
  coverLabel: string;
  galleryLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div data-catalog-field="cover">
        <UploadMedia
          mode="photo"
          label={coverLabel}
          value={cover}
          onChange={onCoverChange}
          maxFiles={1}
        />
      </div>
      <div data-catalog-field="gallery">
        <p className="mb-2 text-[11px] text-muted-foreground">Até 4 fotos.</p>
        <UploadMedia
          mode="photo"
          multiple
          maxFiles={4}
          label={galleryLabel}
          value={gallery}
          onChange={onGalleryChange}
        />
      </div>
    </div>
  );
}
