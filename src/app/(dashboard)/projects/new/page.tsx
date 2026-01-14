'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { CheckboxGroup } from '@/components/ui/checkbox-group';
import { TagInput } from '@/components/ui/tag-input';
import { ProgressSteps } from '@/components/ui/progress-steps';
import {
  GENRE_OPTIONS,
  TEMPO_OPTIONS,
  INSTRUMENTAL_OPTIONS,
  type CreateProjectInput,
} from '@/lib/validations/project';

const STEPS = [
  { id: 'honoree', name: 'Honoree' },
  { id: 'tone', name: 'Tone' },
  { id: 'music', name: 'Music' },
  { id: 'guardrails', name: 'Details' },
  { id: 'review', name: 'Review' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateProjectInput>({
    honoree_name: '',
    honoree_relationship: '',
    occasion: '',
    tone_heartfelt_funny: 5,
    tone_intimate_anthem: 5,
    tone_minimal_lyrical: 5,
    music_genre_preferences: [],
    music_tempo_preference: 'medium',
    music_vocal_style: 'female',
    music_instrumental_preferences: [],
    must_include_items: [],
    topics_to_avoid: [],
    deadline_hours: 72,
  });

  const updateField = <K extends keyof CreateProjectInput>(
    field: K,
    value: CreateProjectInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create project');
      }

      const project = await response.json();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return (
          formData.honoree_name.trim() !== '' &&
          formData.honoree_relationship.trim() !== '' &&
          formData.occasion.trim() !== ''
        );
      case 1:
        return true;
      case 2:
        return formData.music_genre_preferences.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create a Song for Someone Special
        </h1>
        <p className="text-gray-600">
          Collect memories from friends and family to create a personalized song.
        </p>
      </div>

      <div className="mb-8">
        <ProgressSteps
          steps={STEPS}
          currentStep={currentStep}
          onStepClick={(step) => step < currentStep && setCurrentStep(step)}
        />
      </div>

      <Card className="p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {currentStep === 0 && (
          <HonoreeStep formData={formData} updateField={updateField} />
        )}

        {currentStep === 1 && (
          <ToneStep formData={formData} updateField={updateField} />
        )}

        {currentStep === 2 && (
          <MusicStep formData={formData} updateField={updateField} />
        )}

        {currentStep === 3 && (
          <GuardrailsStep formData={formData} updateField={updateField} />
        )}

        {currentStep === 4 && (
          <ReviewStep formData={formData} />
        )}

        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading} disabled={!canProceed()}>
              Create Project
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

interface StepProps {
  formData: CreateProjectInput;
  updateField: <K extends keyof CreateProjectInput>(
    field: K,
    value: CreateProjectInput[K]
  ) => void;
}

function HonoreeStep({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Who is this song for?
      </h2>

      <Input
        label="Their name"
        value={formData.honoree_name}
        onChange={(e) => updateField('honoree_name', e.target.value)}
        placeholder="e.g., Mom, Dad, Sarah"
      />

      <Input
        label="Your relationship to them"
        value={formData.honoree_relationship}
        onChange={(e) => updateField('honoree_relationship', e.target.value)}
        placeholder="e.g., My mother, Best friend, Grandmother"
      />

      <Textarea
        label="What's the occasion?"
        value={formData.occasion}
        onChange={(e) => updateField('occasion', e.target.value)}
        placeholder="e.g., 60th birthday, Wedding anniversary, Retirement"
        maxLength={200}
        showCount
      />
    </div>
  );
}

function ToneStep({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold text-gray-900">
        Set the tone for the song
      </h2>

      <Slider
        label="Emotional tone"
        leftLabel="Heartfelt"
        rightLabel="Funny"
        value={formData.tone_heartfelt_funny}
        onChange={(value) => updateField('tone_heartfelt_funny', value)}
      />

      <Slider
        label="Song style"
        leftLabel="Intimate"
        rightLabel="Big Anthem"
        value={formData.tone_intimate_anthem}
        onChange={(value) => updateField('tone_intimate_anthem', value)}
      />

      <Slider
        label="Lyric density"
        leftLabel="Minimal"
        rightLabel="Lyrical"
        value={formData.tone_minimal_lyrical}
        onChange={(value) => updateField('tone_minimal_lyrical', value)}
      />

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Preview:</strong> Your song will be{' '}
          {formData.tone_heartfelt_funny <= 3
            ? 'heartfelt and sincere'
            : formData.tone_heartfelt_funny >= 7
            ? 'playful and fun'
            : 'balanced'}
          ,{' '}
          {formData.tone_intimate_anthem <= 3
            ? 'intimate and personal'
            : formData.tone_intimate_anthem >= 7
            ? 'anthemic and powerful'
            : 'moderately energetic'}
          , with{' '}
          {formData.tone_minimal_lyrical <= 3
            ? 'minimal, impactful lyrics'
            : formData.tone_minimal_lyrical >= 7
            ? 'rich, detailed lyrics'
            : 'balanced lyrics'}
          .
        </p>
      </div>
    </div>
  );
}

function MusicStep({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Musical preferences
      </h2>

      <CheckboxGroup
        label="Select genres (pick at least one)"
        options={GENRE_OPTIONS}
        selected={formData.music_genre_preferences}
        onChange={(selected) => updateField('music_genre_preferences', selected)}
        columns={2}
      />

      <Select
        label="Tempo"
        value={formData.music_tempo_preference}
        onChange={(e) => updateField('music_tempo_preference', e.target.value)}
        options={TEMPO_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vocal style
        </label>
        <div className="flex gap-4">
          {(['male', 'female', 'choir'] as const).map((style) => (
            <label
              key={style}
              className={`flex-1 p-4 border rounded-lg cursor-pointer text-center transition-colors ${
                formData.music_vocal_style === style
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="vocal_style"
                value={style}
                checked={formData.music_vocal_style === style}
                onChange={(e) =>
                  updateField('music_vocal_style', e.target.value as typeof style)
                }
                className="sr-only"
              />
              <span className="capitalize">{style}</span>
            </label>
          ))}
        </div>
      </div>

      <CheckboxGroup
        label="Featured instruments (optional)"
        options={INSTRUMENTAL_OPTIONS}
        selected={formData.music_instrumental_preferences}
        onChange={(selected) =>
          updateField('music_instrumental_preferences', selected)
        }
        columns={3}
      />
    </div>
  );
}

function GuardrailsStep({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Additional details
      </h2>

      <TagInput
        label="Names, places, or things to include"
        tags={formData.must_include_items}
        onChange={(tags) => updateField('must_include_items', tags)}
        placeholder="Type and press Enter"
        helperText="e.g., their pet's name, a special place, a nickname"
      />

      <TagInput
        label="Topics to avoid"
        tags={formData.topics_to_avoid}
        onChange={(tags) => updateField('topics_to_avoid', tags)}
        placeholder="Type and press Enter"
        helperText="e.g., sensitive topics, family issues"
      />

      <Select
        label="Collection deadline"
        value={formData.deadline_hours.toString()}
        onChange={(e) => updateField('deadline_hours', parseInt(e.target.value))}
        options={[
          { value: '24', label: '24 hours' },
          { value: '48', label: '48 hours' },
          { value: '72', label: '72 hours (recommended)' },
          { value: '96', label: '4 days' },
          { value: '120', label: '5 days' },
          { value: '168', label: '1 week' },
        ]}
        helperText="How long contributors have to submit their memories"
      />
    </div>
  );
}

function ReviewStep({ formData }: { formData: CreateProjectInput }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Review your project
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReviewItem label="Honoree" value={formData.honoree_name} />
        <ReviewItem label="Relationship" value={formData.honoree_relationship} />
        <ReviewItem label="Occasion" value={formData.occasion} />
        <ReviewItem
          label="Deadline"
          value={`${formData.deadline_hours} hours`}
        />
        <ReviewItem
          label="Genres"
          value={formData.music_genre_preferences.join(', ')}
        />
        <ReviewItem
          label="Tempo"
          value={
            TEMPO_OPTIONS.find((t) => t.value === formData.music_tempo_preference)
              ?.label || formData.music_tempo_preference
          }
        />
        <ReviewItem
          label="Vocal Style"
          value={formData.music_vocal_style}
        />
        {formData.must_include_items.length > 0 && (
          <ReviewItem
            label="Must Include"
            value={formData.must_include_items.join(', ')}
          />
        )}
        {formData.topics_to_avoid.length > 0 && (
          <ReviewItem
            label="Topics to Avoid"
            value={formData.topics_to_avoid.join(', ')}
          />
        )}
      </div>

      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <p className="text-sm text-indigo-800">
          After creating this project, you&apos;ll be able to invite friends and
          family to share their memories. The song will be generated once you
          review and curate the submissions.
        </p>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg">
      <dt className="text-xs font-medium text-gray-500 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900 capitalize">{value}</dd>
    </div>
  );
}
