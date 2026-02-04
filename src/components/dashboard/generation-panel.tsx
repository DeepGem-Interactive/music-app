'use client';

import { useState } from 'react';
import { Play, Download, RefreshCw, Music, Pencil, Check } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ErrorAlert } from '@/components/ui/error-alert';
import type { SongVersion } from '@/types';

interface GenerationPanelProps {
  projectId: string;
  status: string;
  latestVersion: SongVersion | null;
  revisionsRemaining: number;
  submissionsCount: number;
  onGenerate: () => void;
  isInstant?: boolean;
}

export function GenerationPanel({
  projectId,
  status,
  latestVersion,
  revisionsRemaining,
  submissionsCount,
  onGenerate,
  isInstant = false,
}: GenerationPanelProps) {
  const [generating, setGenerating] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [distributed, setDistributed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iteration_feedback: feedback || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate song');
      }

      setFeedback('');
      onGenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  };

  const handleDistribute = async () => {
    if (!latestVersion) return;
    setError('');
    setDistributing(true);

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_id: latestVersion.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to distribute song');
      }

      setDistributed(true);
      onGenerate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Distribution failed');
    } finally {
      setDistributing(false);
    }
  };

  const canGenerate = submissionsCount > 0 && revisionsRemaining > 0;

  return (
    <Card>
      <CardHeader
        title="Song Generation"
        description={
          latestVersion
            ? `Version ${latestVersion.version_number}`
            : 'Generate your personalized song'
        }
      />

      {error && <ErrorAlert message={error} className="mb-4" />}

      {latestVersion && latestVersion.status === 'completed' ? (
        <div className="space-y-4">
          {/* Audio Player */}
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Music className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{latestVersion.title}</p>
                <p className="text-sm text-gray-500">
                  Generated {new Date(latestVersion.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {latestVersion.audio_mp3_url && (
              <audio
                controls
                src={latestVersion.audio_mp3_url}
                className="w-full"
              />
            )}
          </div>

          {/* Lyrics */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Lyrics</p>
            <div className="p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {latestVersion.lyrics}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {latestVersion.audio_mp3_url && (
              <a
                href={latestVersion.audio_mp3_url}
                download
                className="w-full"
              >
                <Button variant="outline" className="w-full flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download MP3
                </Button>
              </a>
            )}

            {status !== 'completed' && (
              <Button
                onClick={handleDistribute}
                loading={distributing}
                disabled={distributed}
                className="w-full flex items-center gap-2"
              >
                {distributed ? (
                  <>
                    <Check className="w-4 h-4" />
                    Distributed!
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Distribute to Spotify
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Edit Song */}
          {revisionsRemaining > 0 && status !== 'completed' && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Pencil className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">
                  Edit this song
                </p>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Tell us what you&apos;d like to change — be as specific or vague as you want and we&apos;ll take it from there.
              </p>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., Make the chorus catchier, add more about her garden, make it less cheesy..."
                className="min-h-[80px] text-sm"
                maxLength={500}
                showCount
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} remaining
                </span>
                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  disabled={!feedback.trim()}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : latestVersion && latestVersion.status === 'generating' ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-900 font-medium">Generating your song...</p>
          <p className="text-sm text-gray-500 mt-1">
            This may take a few minutes
          </p>
        </div>
      ) : latestVersion && latestVersion.status === 'failed' ? (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <Music className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="text-sm font-medium text-red-700">Song generation failed</p>
            <p className="text-xs text-red-500 mt-1">
              Something went wrong during generation. You can try again below.
            </p>
          </div>
          {revisionsRemaining > 0 && (
            <Button
              onClick={handleGenerate}
              loading={generating}
              className="w-full"
            >
              Try Again
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg text-center ${isInstant ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gray-50'}`}>
            <Music className={`w-8 h-8 mx-auto mb-2 ${isInstant ? 'text-green-500' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600">
              {submissionsCount === 0
                ? isInstant
                  ? 'Your memories are ready to be transformed into a song.'
                  : 'No submissions yet. Invite contributors to share their memories.'
                : isInstant
                  ? 'Your memories are ready!'
                  : `${submissionsCount} submission${submissionsCount !== 1 ? 's' : ''} ready`}
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            loading={generating}
            disabled={!canGenerate}
            className="w-full"
          >
            {isInstant ? 'Generate My Song' : 'Generate Song'}
          </Button>

          {!canGenerate && submissionsCount > 0 && (
            <p className="text-sm text-red-600 text-center">
              No revisions remaining. Purchase additional credits to continue.
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

