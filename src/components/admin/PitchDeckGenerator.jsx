import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PitchDeckGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [presentationUrl, setPresentationUrl] = useState(null);

  const handleCreateDeck = async () => {
    try {
      setIsLoading(true);
      const response = await base44.functions.invoke('createFeaturePitchDeck');
      
      if (response.data.presentationUrl) {
        setPresentationUrl(response.data.presentationUrl);
        toast.success('Pitch deck created successfully!');
      }
    } catch (error) {
      toast.error('Failed to create pitch deck');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleCreateDeck}
        disabled={isLoading}
        className="text-white"
        style={{ background: 'linear-gradient(to right, var(--gradient-from), var(--gradient-to))' }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating Deck...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Generate Pitch Deck
          </>
        )}
      </Button>

      {presentationUrl && (
        <div 
          className="p-4 rounded-lg border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div>
            <p style={{ color: 'var(--text-color)' }} className="font-semibold">
              Pitch Deck Created
            </p>
            <p style={{ color: 'var(--text-muted)' }} className="text-sm">
              Your Google Slides presentation is ready
            </p>
          </div>
          <a
            href={presentationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--hover-bg)' }}
            title="Open in Google Slides"
          >
            <ExternalLink className="w-5 h-5" style={{ color: 'var(--primary)' }} />
          </a>
        </div>
      )}
    </div>
  );
}