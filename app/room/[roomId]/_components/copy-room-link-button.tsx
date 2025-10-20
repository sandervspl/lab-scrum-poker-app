'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckIcon, CopyIcon } from 'lucide-react';

type Props = {
  roomId: string;
};

export function CopyRoomLinkButton() {
  const [copied, setCopied] = useState(false);
  const { roomId } = useParams<{ roomId: string }>();

  function copyRoomLink() {
    const url = window.location.origin + `/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="outline" size="sm" onClick={copyRoomLink}>
      {copied ? <CheckIcon className="mr-2 size-4" /> : <CopyIcon className="mr-2 size-4" />}
      {copied ? 'Copied!' : 'Copy Link'}
    </Button>
  );
}
