'use client';

import { useState } from 'react';
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Submission, QuickModeAnswers, DeepModeAnswers } from '@/types';

interface SubmissionCardProps {
  submission: Submission;
  onApprove: () => void;
  onExclude: () => void;
}

export function SubmissionCard({
  submission,
  onApprove,
  onExclude,
}: SubmissionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    excluded: 'bg-red-100 text-red-800',
  };

  const answers = submission.answers_json as QuickModeAnswers | DeepModeAnswers;
  const isQuickMode = submission.submission_mode === 'quick';

  return (
    <Card className="overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="text-indigo-600 font-medium">
              {submission.contributor_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {submission.contributor_name}
            </p>
            <p className="text-sm text-gray-500">
              {isQuickMode ? 'Quick mode' : 'Deep mode'} •{' '}
              {new Date(submission.submitted_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              statusStyles[submission.status]
            }`}
          >
            {submission.status}
          </span>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="space-y-4">
            {isQuickMode ? (
              <QuickModeAnswersDisplay answers={answers as QuickModeAnswers} />
            ) : (
              <DeepModeAnswersDisplay answers={answers as DeepModeAnswers} />
            )}

            {submission.voice_note_urls.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Voice Notes
                </p>
                <div className="space-y-2">
                  {submission.voice_note_urls.map((url, index) => (
                    <audio
                      key={index}
                      controls
                      src={url}
                      className="w-full h-10"
                    />
                  ))}
                </div>
              </div>
            )}

            {submission.status === 'pending' && (
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onApprove();
                  }}
                  className="flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onExclude();
                  }}
                  className="flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Exclude
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function QuickModeAnswersDisplay({ answers }: { answers: QuickModeAnswers }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AnswerBlock label="Something they admire" value={answers.admire} />
      <AnswerBlock label="A vivid memory" value={answers.memory} />
      <AnswerBlock label="Phrase/Quirk/Inside joke" value={answers.quirk} />
      <AnswerBlock label="Wish for their future" value={answers.wish} />
    </div>
  );
}

function DeepModeAnswersDisplay({ answers }: { answers: DeepModeAnswers }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <AnswerBlock label="Funny memory" value={answers.memory_funny} />
      <AnswerBlock label="Tender memory" value={answers.memory_tender} />
      <AnswerBlock label="Defining memory" value={answers.memory_defining} />
      <AnswerBlock label="How they show love" value={answers.how_they_show_love} />
      <AnswerBlock label="Current chapter" value={answers.current_chapter} />
      <AnswerBlock label="What matters most" value={answers.what_matters_most} />
    </div>
  );
}

function AnswerBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <p className="text-xs font-medium text-gray-500 uppercase mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
