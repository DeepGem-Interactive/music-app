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
import { Clock, Users, Zap, Plus, Trash2 } from 'lucide-react';
import {
  TEMPO_OPTIONS,
  type CreateProjectInput,
} from '@/lib/validations/project';
import type { CreationMode, QuickModeAnswers, MusicInputMode } from '@/types';

// NEW: Simplified step flow - same for both modes
const STEPS = [
  { id: 'mode', name: 'Mode' },
  { id: 'describe', name: 'Describe Person' },
  { id: 'collaborators', name: 'Collaborators' }, // NEW STEP
  { id: 'music', name: 'Music' },
  { id: 'details', name: 'Details' },
];

interface Collaborator {
  name: string;
  email?: string;
  phone?: string;
}

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
    personality_traits: [],
    favorite_moments: '',
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
    collaborators: [],
  });

  const isInstant = formData.creation_mode === 'instant';

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
    setCurrentStep(1); // Move to describe person step
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
    const stepId = STEPS[currentStep].id;

    switch (stepId) {
      case 'mode':
        return false; // Mode selection happens via buttons
      case 'describe':
        return (
          formData.honoree_name.trim() !== '' &&
          formData.honoree_relationship.trim() !== '' &&
          formData.occasion.trim() !== ''
        );
      case 'collaborators':
        // For instant mode, can skip collaborators
        // For collaborative mode, should have at least one collaborator
        return isInstant || (formData.collaborators && formData.collaborators.length > 0);
      case 'music':
        // Can proceed if surprise mode or has input
        if (formData.music_input_mode === 'surprise') {
          return true;
        }
        return (formData.music_style_references?.trim() ?? '').length > 0;
      case 'details':
        // For instant mode, need memories
        // For collaborative mode, just need to fill out details
        if (isInstant) {
          return (
            formData.instant_memories?.admire.trim() !== '' &&
            formData.instant_memories?.memory.trim() !== '' &&
            formData.instant_memories?.quirk.trim() !== '' &&
            formData.instant_memories?.wish.trim() !== ''
          );
        }
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    const stepId = STEPS[currentStep].id;

    switch (stepId) {
      case 'mode':
        return <ModeSelectionStep onSelect={handleModeSelect} />;
      case 'describe':
        return <DescribePersonStep formData={formData} updateField={updateField} />;
      case 'collaborators':
        return <CollaboratorsStep formData={formData} updateField={updateField} isInstant={isInstant} />;
      case 'music':
        return <MusicStep formData={formData} updateField={updateField} />;
      case 'details':
        return <DetailsStep formData={formData} updateField={updateField} isInstant={isInstant} />;
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
            : 'Invite collaborators to share memories and create a beautiful song together.'}
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

        {renderStep()}

        {STEPS[currentStep].id !== 'mode' && (
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
                {isInstant ? 'Create & Generate Song' : 'Create Project & Send Invites'}
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

// NEW: Step 1 - Describe Person (combines honoree info + personality traits + favorite moments)
function DescribePersonStep({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Tell us about the person
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

      <TagInput
        label="Personality traits (optional)"
        tags={formData.personality_traits || []}
        onChange={(tags) => updateField('personality_traits', tags)}
        placeholder="Type a trait and press Enter"
        helperText="e.g., kind, funny, adventurous, patient, wise"
      />

      <Textarea
        label="Favorite moments together (optional)"
        value={formData.favorite_moments || ''}
        onChange={(e) => updateField('favorite_moments', e.target.value)}
        placeholder="Share your favorite memories or moments with this person..."
        maxLength={1000}
        showCount
        rows={4}
      />
    </div>
  );
}

// NEW: Step 2 - Collaborators
function CollaboratorsStep({ formData, updateField, isInstant }: StepProps & { isInstant: boolean }) {
  const collaborators = formData.collaborators || [];

  const addCollaborator = () => {
    updateField('collaborators', [...collaborators, { name: '', email: '', phone: '' }]);
  };

  const removeCollaborator = (index: number) => {
    updateField('collaborators', collaborators.filter((_, i) => i !== index));
  };

  const updateCollaborator = (index: number, field: keyof Collaborator, value: string) => {
    const updated = [...collaborators];
    updated[index] = { ...updated[index], [field]: value };
    updateField('collaborators', updated);
  };

  if (isInstant) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Add collaborators (optional)
        </h2>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            Since you&apos;re creating an instant song, you can skip this step. 
            Or add collaborators if you&apos;d like to invite others to contribute later.
          </p>
        </div>
        
        {collaborators.length === 0 ? (
          <Button onClick={addCollaborator} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add a collaborator (optional)
          </Button>
        ) : (
          <div className="space-y-4">
            {collaborators.map((collab, index) => (
              <CollaboratorForm
                key={index}
                collaborator={collab}
                index={index}
                onUpdate={updateCollaborator}
                onRemove={removeCollaborator}
              />
            ))}
            <Button onClick={addCollaborator} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add another collaborator
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">
        Who would you like to invite?
      </h2>
      <p className="text-sm text-gray-600">
        Add friends and family who can share their memories. We&apos;ll send them an invitation to contribute.
      </p>

      {collaborators.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No collaborators added yet</p>
          <Button onClick={addCollaborator}>
            <Plus className="w-4 h-4 mr-2" />
            Add first collaborator
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {collaborators.map((collab, index) => (
            <CollaboratorForm
              key={index}
              collaborator={collab}
              index={index}
              onUpdate={updateCollaborator}
              onRemove={removeCollaborator}
            />
          ))}
          <Button onClick={addCollaborator} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Add another collaborator
          </Button>
        </div>
      )}

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

function CollaboratorForm({
  collaborator,
  index,
  onUpdate,
  onRemove,
}: {
  collaborator: Collaborator;
  index: number;
  onUpdate: (index: number, field: keyof Collaborator, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <div className="flex-1 space-y-3">
          <Input
            label={`Collaborator ${index + 1} name`}
            value={collaborator.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            placeholder="e.g., John Smith"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              value={collaborator.email || ''}
              onChange={(e) => onUpdate(index, 'email', e.target.value)}
              placeholder="john@example.com"
            />
            <Input
              label="Phone (optional)"
              type="tel"
              value={collaborator.phone || ''}
              onChange={(e) => onUpdate(index, 'phone', e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
        <div className="flex items-start pt-6">
          <button
            onClick={() => onRemove(index)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            type="button"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </Card>
  );
}

// Step 3: Music Preferences
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

      {/* Tempo & Vocal Style - Always Show */}
      <div className="grid grid-cols-2 gap-4">
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
          <div className="flex gap-2">
            {(['male', 'female', 'choir'] as const).map((style) => (
              <label
                key={style}
                className={`flex-1 p-3 border rounded-lg cursor-pointer text-center transition-colors text-sm ${
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

      {/* Tone Sliders */}
      <div className="space-y-6 pt-4">
        <h3 className="font-medium text-gray-900">Set the tone</h3>
        
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
      </div>
    </div>
  );
}

// Step 4: Details (memories for instant mode, or additional details for collaborative)
function DetailsStep({ formData, updateField, isInstant }: StepProps & { isInstant: boolean }) {
  if (isInstant) {
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

  // Collaborative mode - additional details
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

      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
        <p className="text-sm text-indigo-800">
          After you create this project, we&apos;ll send invitations to your collaborators. 
          They&apos;ll have {formData.deadline_hours} hours to share their memories. 
          Once submissions are in, you&apos;ll review and curate them before generating the song.
        </p>
      </div>
    </div>
  );
}
