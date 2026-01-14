'use client';

import { useState } from 'react';
import { Play, Download, RefreshCw, Music } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SongVersion } from '@/types';

interface GenerationPanelProps {
  projectId: string;
  status: string;
  latestVersion: SongVersion | null;
  revisionsRemaining: number;
  submissionsCount: number;
  onGenerate: () => void;
}

export function GenerationPanel({
  projectId,
  status,
  latestVersion,
  revisionsRemaining,
  submissionsCount,
  onGenerate,
}: GenerationPanelProps) {
  const [generating, setGenerating] = useState(false);
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
        const data = await response.json();
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

    try {
      await fetch(`/api/v1/projects/${projectId}/distribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version_id: latestVersion.id,
        }),
      });
      onGenerate();
    } catch (err) {
      console.error('Distribution failed:', err);
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

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

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
                className="w-full flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Distribute to Spotify
              </Button>
            )}
          </div>

          {/* Iteration */}
          {revisionsRemaining > 0 && status !== 'completed' && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Want to make changes? ({revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} remaining)
              </p>
              <div className="space-y-2">
                {ITERATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFeedback(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-colors ${
                      feedback === option.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {feedback && (
                <Button
                  onClick={handleGenerate}
                  loading={generating}
                  className="w-full mt-3 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </Button>
              )}
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
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <Music className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {submissionsCount === 0
                ? 'No submissions yet. Invite contributors to share their memories.'
                : `${submissionsCount} submission${submissionsCount !== 1 ? 's' : ''} ready`}
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            loading={generating}
            disabled={!canGenerate}
            className="w-full"
          >
            Generate Song
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

const ITERATION_OPTIONS = [
  { value: 'more_minimal', label: 'More minimal' },
  { value: 'more_upbeat', label: 'More upbeat' },
  { value: 'more_tearjerker', label: 'More emotional / tearjerker' },
  { value: 'shorter_chorus', label: 'Shorter chorus' },
  { value: 'fix_pronunciation', label: 'Fix pronunciation' },
];
