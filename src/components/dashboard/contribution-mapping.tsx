'use client';

import { Card } from '@/components/ui/card';
import type { Submission, SongVersion } from '@/types';

interface ContributionMappingProps {
  songVersion: SongVersion;
  submissions: Submission[];
}

interface LyricSection {
  type: 'verse1' | 'chorus' | 'verse2' | 'bridge' | 'outro';
  lyrics: string;
  contributorNames: string[];
  matchedContent: string[];
}

export function ContributionMapping({ songVersion, submissions }: ContributionMappingProps) {
  // Parse lyrics into sections
  const sections = parseLyricsIntoSections(songVersion.lyrics);

  // Map contributions to sections
  const mappedSections = sections.map((section) =>
    mapContributionsToSection(section, submissions)
  );

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Contribution Mapping
      </h2>
      <p className="text-sm text-gray-600 mb-6">
        See which memories and stories influenced each part of the song
      </p>

      <div className="space-y-6">
        {mappedSections.map((section, index) => (
          <SectionCard key={index} section={section} />
        ))}
      </div>
    </Card>
  );
}

function SectionCard({ section }: { section: LyricSection }) {
  const sectionColors = {
    verse1: 'bg-blue-50 border-blue-200',
    chorus: 'bg-purple-50 border-purple-200',
    verse2: 'bg-blue-50 border-blue-200',
    bridge: 'bg-amber-50 border-amber-200',
    outro: 'bg-gray-50 border-gray-200',
  };

  const sectionBadgeColors = {
    verse1: 'bg-blue-100 text-blue-700',
    chorus: 'bg-purple-100 text-purple-700',
    verse2: 'bg-blue-100 text-blue-700',
    bridge: 'bg-amber-100 text-amber-700',
    outro: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className={`border rounded-lg p-4 ${sectionColors[section.type]}`}>
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
            sectionBadgeColors[section.type]
          }`}
        >
          {section.type.replace(/(\d)/, ' $1')}
        </span>
        {section.contributorNames.length > 0 && (
          <span className="text-xs text-gray-600">
            • Inspired by {section.contributorNames.join(', ')}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Lyrics */}
        <div className="font-medium text-gray-900 whitespace-pre-line">
          {section.lyrics}
        </div>

        {/* Matched content from contributions */}
        {section.matchedContent.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200/50">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Influenced by these contributions:
            </p>
            <div className="space-y-2">
              {section.matchedContent.map((content, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-700 italic bg-white/50 p-2 rounded"
                >
                  &ldquo;{content}&rdquo;
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseLyricsIntoSections(lyrics: string): LyricSection[] {
  const sections: LyricSection[] = [];
  const lines = lyrics.split('\n');

  let currentSection: LyricSection | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section headers
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection);
      }

      // Start new section
      const sectionName = trimmed
        .slice(1, -1)
        .toLowerCase()
        .replace(/\s+/g, '');

      let sectionType: LyricSection['type'] = 'verse1';
      if (sectionName.includes('verse1') || sectionName === 'verse') {
        sectionType = 'verse1';
      } else if (sectionName.includes('verse2')) {
        sectionType = 'verse2';
      } else if (sectionName.includes('chorus')) {
        sectionType = 'chorus';
      } else if (sectionName.includes('bridge')) {
        sectionType = 'bridge';
      } else if (sectionName.includes('outro')) {
        sectionType = 'outro';
      }

      currentSection = {
        type: sectionType,
        lyrics: '',
        contributorNames: [],
        matchedContent: [],
      };
    } else if (currentSection && trimmed) {
      // Add lyrics to current section
      if (currentSection.lyrics) {
        currentSection.lyrics += '\n' + trimmed;
      } else {
        currentSection.lyrics = trimmed;
      }
    }
  }

  // Save last section
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function mapContributionsToSection(
  section: LyricSection,
  submissions: Submission[]
): LyricSection {
  const mappedSection = { ...section };
  const contributorNames = new Set<string>();
  const matchedContent: string[] = [];

  const sectionLowerCase = section.lyrics.toLowerCase();

  for (const submission of submissions) {
    const answers = submission.answers_json;

    // Extract text from all answers
    const answerTexts: string[] = [];
    if (typeof answers === 'object' && answers !== null) {
      Object.values(answers).forEach((value) => {
        if (typeof value === 'string' && value.trim()) {
          answerTexts.push(value);
        }
      });
    }

    // Check if any answer content appears in the section
    for (const answerText of answerTexts) {
      // Skip very short answers (less than 2 words)
      const words = answerText.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      if (words.length < 2) continue;

      // Extract key phrases (use 2-3 word sequences based on availability)
      const phraseLength = Math.min(3, words.length);
      for (let i = 0; i <= words.length - phraseLength; i++) {
        const phrase = words.slice(i, i + phraseLength).join(' ');
        if (sectionLowerCase.includes(phrase)) {
          contributorNames.add(submission.contributor_name);
          // Find the sentence containing this phrase
          const sentences = answerText.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(phrase)) {
              const trimmedSentence = sentence.trim();
              if (
                trimmedSentence &&
                !matchedContent.includes(trimmedSentence) &&
                matchedContent.length < 3 // Limit to 3 matches per section
              ) {
                matchedContent.push(trimmedSentence);
              }
              break;
            }
          }
          break;
        }
      }
    }
  }

  mappedSection.contributorNames = Array.from(contributorNames);
  mappedSection.matchedContent = matchedContent;

  return mappedSection;
}
