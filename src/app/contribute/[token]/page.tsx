'use client';

import { useEffect, useState, use } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Countdown } from '@/components/ui/countdown';
import { ProgressSteps } from '@/components/ui/progress-steps';
import {
  QUICK_MODE_QUESTIONS,
  DEEP_MODE_QUESTIONS,
  type QuickModeAnswersInput,
  type DeepModeAnswersInput,
} from '@/lib/validations/contribution';
import type { ContributionContext, SubmissionMode } from '@/types';

export default function ContributePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const [context, setContext] = useState<ContributionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [mode, setMode] = useState<SubmissionMode | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const response = await fetch(`/api/v1/contributions/${resolvedParams.token}`);
        if (!response.ok) {
          if (response.status === 410) {
            throw new Error('This contribution link has expired.');
          }
          if (response.status === 404) {
            throw new Error('Invalid contribution link.');
          }
          throw new Error('Failed to load contribution page');
        }
        const data = await response.json();
        setContext(data);
        if (data.already_submitted && data.previous_answers) {
          setAnswers(data.previous_answers);
          setSubmitted(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchContext();
  }, [resolvedParams.token]);

  const questions = mode === 'quick' ? QUICK_MODE_QUESTIONS : DEEP_MODE_QUESTIONS;

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!mode) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/v1/contributions/${resolvedParams.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contributor_name: name,
          submission_mode: mode,
          answers,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const isCurrentAnswerComplete = () => {
    const questionId = questions[currentQuestion]?.id;
    return answers[questionId]?.trim().length > 0;
  };

  const allQuestionsAnswered = () => {
    return questions.every((q) => answers[q.id]?.trim().length > 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{error}</h2>
          <p className="text-gray-600">
            Please contact the person who sent you this link.
          </p>
        </Card>
      </div>
    );
  }

  if (!context) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Thank you for contributing!
          </h2>
          <p className="text-gray-600 mb-4">
            Your memories for {context.honoree_name} have been submitted.
            {context.host_name} will use them to create a special song.
          </p>
          <p className="text-sm text-gray-500">
            You can close this page now.
          </p>
        </Card>
      </div>
    );
  }

  // Mode selection
  if (!mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto pt-8 sm:pt-16">
          <Card className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Share your memories of {context.honoree_name}
            </h1>
            <p className="text-gray-600 mb-2">
              {context.host_name} is creating a personalized song for{' '}
              {context.honoree_name} ({context.honoree_relationship}) for their{' '}
              {context.occasion}.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              The song will be {context.tone_description}.
            </p>

            <div className="mb-6">
              <Countdown deadline={context.deadline_timestamp} size="sm" />
            </div>

            <div className="mb-6">
              <Input
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we credit you?"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => name.trim() && setMode('quick')}
                disabled={!name.trim()}
                className="p-6 border-2 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  Quick Mode
                </div>
                <div className="text-sm text-gray-500 mb-3">60-90 seconds</div>
                <div className="text-sm text-gray-600">
                  4 quick questions about your favorite memories
                </div>
              </button>

              <button
                onClick={() => name.trim() && setMode('deep')}
                disabled={!name.trim()}
                className="p-6 border-2 rounded-xl text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  Deep Mode
                </div>
                <div className="text-sm text-gray-500 mb-3">5-7 minutes</div>
                <div className="text-sm text-gray-600">
                  6 thoughtful questions for a more detailed tribute
                </div>
              </button>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              Please don&apos;t share sensitive information you wouldn&apos;t want in a song.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Question flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto pt-8 sm:pt-16">
        <div className="mb-6">
          <ProgressSteps
            steps={questions.map((q, i) => ({ id: q.id, name: `Q${i + 1}` }))}
            currentStep={currentQuestion}
          />
        </div>

        <Card>
          <div className="mb-1 text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {questions[currentQuestion].label}
          </h2>

          <Textarea
            value={answers[questions[currentQuestion].id] || ''}
            onChange={(e) =>
              handleAnswerChange(questions[currentQuestion].id, e.target.value)
            }
            placeholder={questions[currentQuestion].placeholder}
            maxLength={questions[currentQuestion].maxLength}
            showCount
            className="min-h-[150px]"
          />

          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion < questions.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentQuestion((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                disabled={!isCurrentAnswerComplete()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={!allQuestionsAnswered()}
              >
                Submit
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
