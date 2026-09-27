import { CREATE_TYPE_UNAVAILABLE_MESSAGE } from "@/lib/create/create-hub-destinations";
import { PublisherHeader } from "@/components/publisher/PublisherHeader";
import { PublisherLayout } from "@/components/publisher/PublisherLayout";

interface CreateTypeUnavailableProps {
  title: string;
}

export function CreateTypeUnavailable({ title }: CreateTypeUnavailableProps) {
  return (
    <PublisherLayout>
      <PublisherHeader title={title} />
      <div className="flex-1 overflow-y-auto px-5 py-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {CREATE_TYPE_UNAVAILABLE_MESSAGE}
        </p>
      </div>
    </PublisherLayout>
  );
}
