import { startTransition, useOptimistic } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { PresentationIcon } from 'lucide-react';

type Props = {
  className?: string;
};

export function PresentationModeToggle({ className }: Props) {
  const searchParams = useSearchParams();
  const [isPresentationMode, setIsPresentationMode] = useOptimistic(
    searchParams.get('mode') === 'presentation',
  );
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();

  function togglePresentationMode() {
    startTransition(() => {
      const newMode = isPresentationMode ? 'normal' : 'presentation';
      setIsPresentationMode(newMode === 'presentation');
      router.replace(`/room/${roomId}?mode=${newMode}`);
    });
  }

  return (
    <Label
      htmlFor="presentation-mode"
      className={cn('flex cursor-pointer items-center gap-2 text-sm *:cursor-pointer', className)}
    >
      <div className="flex items-center gap-2">
        <PresentationIcon className="size-4" />
        Presentation mode
      </div>
      <Switch
        id="presentation-mode"
        checked={isPresentationMode}
        onCheckedChange={() => togglePresentationMode()}
      />
    </Label>
  );
}
