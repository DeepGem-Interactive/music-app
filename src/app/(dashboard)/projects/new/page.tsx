'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select } from '@/components/ui/select';
import { TagInput } from '@/components/ui/tag-input';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Clock, Users, Zap } from 'lucide-react';
import {
  TEMPO_OPTIONS,
  type CreateProjectInput,
} from '@/lib/validations/project';
import type { CreationMode, QuickModeAnswers, MusicInputMode } from '@/types';

const COLLABORATIVE_STEPS = [
  { id: 'mode', name: 'Mode' },
  { id: 'honoree', name: 'Honoree' },
  { id: 'tone', name: 'Tone' },
  { id: 'music', name: 'Music' },
  { id: 'guardrails', name: 'Details' },
  { id: 'review', name: 'Review' },
];

const INSTANT_STEPS = [
  { id: 'mode', name: 'Mode' },
  { id: 'honoree', name: 'Honoree' },
  { id: 'tone', name: 'Tone' },
  { id: 'music', name: 'Music' },
  { id: 'memories', name: 'Memories' },
  { id: 'review', name: 'Review' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateProjectInput>({
    creation_mode: 'collaborative',
    honoree_name: '',
    honoree_relationship: '',
    occasion: '',
    tone_heartfelt_funny: 5,
    tone_intimate_anthem: 5,
    tone_minimal_lyrical: 5,
    // New music input system
    music_input_mode: 'songs',
    music_style_references: undefined,
    music_inferred_style: undefined,
    // Legacy fields
    music_genre_preferences: [],
    music_tempo_preference: 'medium',
    music_vocal_style: 'female',
    music_instrumental_preferences: [],
    // Personalization
    honoree_details: undefined,
    must_include_items: [],
    topics_to_avoid: [],
    deadline_hours: 72,
    instant_memories: undefined,
  });

  const isInstant = formData.creation_mode === 'instant';
  const steps = isInstant ? INSTANT_STEPS : COLLABORATIVE_STEPS;

  const updateField = <K extends keyof CreateProjectInput>(
    field: K,
    value: CreateProjectInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleModeSelect = (mode: CreationMode) => {
    setFormData((prev) => ({
      ...prev,
      creation_mode: mode,
      // Initialize instant_memories when switching to instant mode
      instant_memories: mode === 'instant' ? { admire: '', memory: '', quirk: '', wish: '' } : undefined,
    }));
    setCurrentStep(1); // Move to honoree step
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
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
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case 'mode':
        return false; // Mode selection happens via buttons
      case 'honoree':
        return (
          formData.honoree_name.trim() !== '' &&
          formData.honoree_relationship.trim() !== '' &&
          formData.occasion.trim() !== ''
        );
      case 'tone':
        return true;
      case 'music':
        // Can proceed if:
        // - surprise mode (no input needed)
        // - songs/vibe mode with input (inference is optional)
        if (formData.music_input_mode === 'surprise') {
          return true;
        }
        // Just need some input for songs/vibe modes - inference is optional
        return (formData.music_style_references?.trim() ?? '').length > 0;
      case 'guardrails':
        return true;
      case 'memories':
        return (
          formData.instant_memories?.admire.trim() !== '' &&
          formData.instant_memories?.memory.trim() !== '' &&
          formData.instant_memories?.quirk.trim() !== '' &&
          formData.instant_memories?.wish.trim() !== ''
        );
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    const stepId = steps[currentStep].id;

    switch (stepId) {
      case 'mode':
        return <ModeSelectionStep onSelect={handleModeSelect} />;
      case 'honoree':
        return <HonoreeStep formData={formData} updateField={updateField} />;
      case 'tone':
        return <ToneStep formData={formData} updateField={updateField} />;
      case 'music':
        return <MusicStep formData={formData} updateField={updateField} />;
      case 'guardrails':
        return <GuardrailsStep formData={formData} updateField={updateField} />;
      case 'memories':
        return <MemoriesStep formData={formData} updateField={updateField} />;
      case 'review':
        return <ReviewStep formData={formData} isInstant={isInstant} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create a Song for Someone Special
        </h1>
        <p className="text-gray-600">
          {isInstant
            ? 'Create a personalized song in minutes with your own memories.'
            : 'Collect memories from friends and family to create a personalized song.'}
        </p>
      </div>

      <div className="mb-8">
        <ProgressSteps
          steps={steps}
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

        {renderStep()}

        {steps[currentStep].id !== 'mode' && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading} disabled={!canProceed()}>
                {isInstant ? 'Create & Generate Song' : 'Create Project'}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function ModeSelectionStep({ onSelect }: { onSelect: (mode: CreationMode) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        How would you like to create this song?
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onSelect('instant')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200">
            <Zap className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Song</h3>
          <p className="text-sm text-gray-600 mb-4">
            Create a song in minutes using your own memories and stories.
          </p>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <Clock className="w-4 h-4" />
            <span>Ready in ~1 minute</span>
          </div>
        </button>

        <button
          onClick={() => onSelect('collaborative')}
          className="p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-200">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Collaborative Song</h3>
          <p className="text-sm text-gray-600 mb-4">
            Invite friends and family to contribute their memories.
          </p>
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <Clock className="w-4 h-4" />
            <span>24-72 hours to collect</span>
          </div>
        </button>
      </div>
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
  const [inferring, setInferring] = useState(false);
  const [inferError, setInferError] = useState('');

  const handleModeChange = (mode: MusicInputMode) => {
    updateField('music_input_mode', mode);
    updateField('music_style_references', undefined);
    updateField('music_inferred_style', undefined);
    setInferError('');

    // For surprise mode, immediately get default style
    if (mode === 'surprise') {
      inferStyle(mode, '', formData.occasion);
    }
  };

  const inferStyle = async (mode: MusicInputMode, input: string, occasion?: string) => {
    setInferring(true);
    setInferError('');

    try {
      const response = await fetch('/api/v1/music/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, input, occasion }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to infer style');
      }

      updateField('music_inferred_style', data.style);
      // Update legacy fields for backward compatibility
      updateField('music_genre_preferences', data.style.genres);
      updateField('music_instrumental_preferences', data.style.suggestedInstruments);
    } catch (err) {
      setInferError(err instanceof Error ? err.message : 'Failed to analyze music style');
    } finally {
      setInferring(false);
    }
  };

  const handleInputChange = (value: string) => {
    updateField('music_style_references', value);
    updateField('music_inferred_style', undefined);
  };

  const handleInferClick = () => {
    if (formData.music_style_references?.trim()) {
      inferStyle(formData.music_input_mode, formData.music_style_references, formData.occasion);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        What style of music?
      </h2>

      {/* Mode Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How would you like to describe the music style?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { mode: 'songs' as const, label: 'Songs/Artists', icon: '♫', desc: 'Name favorite songs or artists' },
            { mode: 'vibe' as const, label: 'Describe the vibe', icon: '✨', desc: 'Describe the mood or feeling' },
            { mode: 'surprise' as const, label: 'Surprise me!', icon: '🎲', desc: 'We\'ll pick based on occasion' },
          ].map(({ mode, label, icon, desc }) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleModeChange(mode)}
              className={`p-4 border-2 rounded-xl text-left transition-all ${
                formData.music_input_mode === mode
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl mb-2 block">{icon}</span>
              <span className="font-medium text-sm block">{label}</span>
              <span className="text-xs text-gray-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Field - Songs/Artists Mode */}
      {formData.music_input_mode === 'songs' && (
        <div>
          <Textarea
            label="What songs or artists does this person love?"
            value={formData.music_style_references || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="e.g., Taylor Swift, Ed Sheeran, Adele, 'Perfect' by Ed Sheeran"
            maxLength={500}
            showCount
            rows={3}
          />
          <p className="mt-1 text-sm text-gray-500">
            Enter favorite songs or artists, separated by commas
          </p>
          {formData.music_style_references && !formData.music_inferred_style && (
            <Button
              onClick={handleInferClick}
              loading={inferring}
              className="mt-3"
              variant="outline"
            >
              Analyze Style
            </Button>
          )}
        </div>
      )}

      {/* Input Field - Vibe Mode */}
      {formData.music_input_mode === 'vibe' && (
        <div>
          <Textarea
            label="Describe the vibe or feeling you want"
            value={formData.music_style_references || ''}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="e.g., Upbeat and celebratory like a party anthem, or soft and romantic like a wedding dance"
            maxLength={500}
            showCount
            rows={3}
          />
          <p className="mt-1 text-sm text-gray-500">
            Describe the mood, energy, or feeling you envision for the song
          </p>
          {formData.music_style_references && !formData.music_inferred_style && (
            <Button
              onClick={handleInferClick}
              loading={inferring}
              className="mt-3"
              variant="outline"
            >
              Analyze Style
            </Button>
          )}
        </div>
      )}

      {/* Surprise Mode Message */}
      {formData.music_input_mode === 'surprise' && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-sm text-amber-800">
            We&apos;ll create something perfect for a <strong>{formData.occasion || 'special occasion'}</strong>!
          </p>
        </div>
      )}

      {/* Error Message */}
      {inferError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {inferError}
        </div>
      )}

      {/* Inferred Style Preview */}
      {formData.music_inferred_style && (
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Detected Style</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Genres:</span>
              <p className="text-gray-900">{formData.music_inferred_style.genres.join(', ')}</p>
            </div>
            <div>
              <span className="text-gray-500">Mood:</span>
              <p className="text-gray-900 capitalize">{formData.music_inferred_style.mood}</p>
            </div>
            <div>
              <span className="text-gray-500">Tempo:</span>
              <p className="text-gray-900 capitalize">{formData.music_inferred_style.tempoHint}</p>
            </div>
            <div>
              <span className="text-gray-500">Instruments:</span>
              <p className="text-gray-900">{formData.music_inferred_style.suggestedInstruments.join(', ')}</p>
            </div>
          </div>
          {formData.music_inferred_style.styleKeywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.music_inferred_style.styleKeywords.map((keyword) => (
                <span
                  key={keyword}
                  className="px-2 py-1 bg-white/60 text-indigo-700 text-xs rounded-full"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {inferring && (
        <div className="flex items-center justify-center p-6">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-3" />
          <span className="text-gray-600">Analyzing music style...</span>
        </div>
      )}

      {/* Tempo Selection - Always Show */}
      <Select
        label="Tempo"
        value={formData.music_tempo_preference}
        onChange={(e) => updateField('music_tempo_preference', e.target.value)}
        options={TEMPO_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
      />

      {/* Vocal Style - Always Show */}
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

function MemoriesStep({ formData, updateField }: StepProps) {
  const memories = formData.instant_memories || { admire: '', memory: '', quirk: '', wish: '' };

  const updateMemory = (field: keyof QuickModeAnswers, value: string) => {
    updateField('instant_memories', { ...memories, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Share your memories of {formData.honoree_name || 'them'}
      </h2>
      <p className="text-gray-600 text-sm">
        These answers will be woven into the song lyrics. Be specific and personal!
      </p>

      <Textarea
        label={`What do you admire most about ${formData.honoree_name || 'them'}?`}
        value={memories.admire}
        onChange={(e) => updateMemory('admire', e.target.value)}
        placeholder="e.g., Their endless patience and how they always know the right thing to say"
        maxLength={500}
        showCount
        rows={3}
      />

      <Textarea
        label="Share a favorite memory together"
        value={memories.memory}
        onChange={(e) => updateMemory('memory', e.target.value)}
        placeholder="e.g., That summer road trip when we got lost and ended up finding the best diner"
        maxLength={500}
        showCount
        rows={3}
      />

      <Textarea
        label="What unique trait or quirk makes them special?"
        value={memories.quirk}
        onChange={(e) => updateMemory('quirk', e.target.value)}
        placeholder="e.g., They always hum while cooking and can never remember where they put their keys"
        maxLength={500}
        showCount
        rows={3}
      />

      <Textarea
        label={`What do you wish for ${formData.honoree_name || 'them'}?`}
        value={memories.wish}
        onChange={(e) => updateMemory('wish', e.target.value)}
        placeholder="e.g., That they find peace and keep spreading joy wherever they go"
        maxLength={500}
        showCount
        rows={3}
      />
    </div>
  );
}

function ReviewStep({ formData, isInstant }: { formData: CreateProjectInput; isInstant: boolean }) {
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
          label="Mode"
          value={isInstant ? 'Instant' : 'Collaborative'}
        />
        {!isInstant && (
          <ReviewItem
            label="Deadline"
            value={`${formData.deadline_hours} hours`}
          />
        )}
        <ReviewItem
          label="Music Style"
          value={
            formData.music_input_mode === 'surprise'
              ? 'Surprise me!'
              : formData.music_inferred_style?.genres.join(', ') || 'Not specified'
          }
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

      {isInstant && formData.instant_memories && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Your Memories</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500">What you admire:</span>
              <p className="text-gray-700">{formData.instant_memories.admire}</p>
            </div>
            <div>
              <span className="text-gray-500">Favorite memory:</span>
              <p className="text-gray-700">{formData.instant_memories.memory}</p>
            </div>
            <div>
              <span className="text-gray-500">Unique trait:</span>
              <p className="text-gray-700">{formData.instant_memories.quirk}</p>
            </div>
            <div>
              <span className="text-gray-500">Your wish:</span>
              <p className="text-gray-700">{formData.instant_memories.wish}</p>
            </div>
          </div>
        </div>
      )}

      <div className={`p-4 rounded-lg border ${isInstant ? 'bg-green-50 border-green-100' : 'bg-indigo-50 border-indigo-100'}`}>
        <p className={`text-sm ${isInstant ? 'text-green-800' : 'text-indigo-800'}`}>
          {isInstant ? (
            <>
              Your song will start generating immediately after you click
              &quot;Create &amp; Generate Song&quot;. Generation typically takes about 45 seconds.
            </>
          ) : (
            <>
              After creating this project, you&apos;ll be able to invite friends and
              family to share their memories. The song will be generated once you
              review and curate the submissions.
            </>
          )}
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
