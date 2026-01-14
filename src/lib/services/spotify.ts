// Mock Spotify distribution service
// In production, replace with actual Spotify for Artists API or distributor API

interface DistributeSongParams {
  audioUrl: string;
  coverArtUrl: string;
  title: string;
  artist: string;
  contributors: string[];
  genre?: string;
}

interface DistributionResult {
  distributionId: string;
  status: 'processing' | 'live' | 'rejected';
  spotifyUrl?: string;
  estimatedLiveDate?: string;
  error?: string;
}

// Simulated distribution storage
const distributions = new Map<string, DistributionResult>();

export async function distributeSong(params: DistributeSongParams): Promise<{ distributionId: string }> {
  const distributionId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate estimated live date (24-48 hours)
  const liveDate = new Date();
  liveDate.setHours(liveDate.getHours() + 24 + Math.random() * 24);

  distributions.set(distributionId, {
    distributionId,
    status: 'processing',
    estimatedLiveDate: liveDate.toISOString(),
  });

  console.log('[Mock Spotify Distribution]', {
    distributionId,
    title: params.title,
    artist: params.artist,
    contributors: params.contributors,
  });

  // Simulate async processing - go live after delay
  setTimeout(() => {
    const dist = distributions.get(distributionId);
    if (dist) {
      // 95% success rate
      if (Math.random() > 0.05) {
        distributions.set(distributionId, {
          ...dist,
          status: 'live',
          spotifyUrl: `https://open.spotify.com/track/mock_${distributionId}`,
        });
      } else {
        distributions.set(distributionId, {
          ...dist,
          status: 'rejected',
          error: 'Distribution failed. Please try again or download the export package.',
        });
      }
    }
  }, 5000); // 5 second delay for demo purposes

  return { distributionId };
}

export async function getDistributionStatus(distributionId: string): Promise<DistributionResult | null> {
  return distributions.get(distributionId) || null;
}

// Generate export package for manual distribution
export interface ExportPackage {
  audioWavUrl: string;
  audioMp3Url: string;
  coverArtUrl: string;
  metadata: {
    title: string;
    artist: string;
    contributors: string[];
    genre: string;
    year: number;
    isrcPlaceholder: string;
  };
  lyricsText: string;
}

export function generateExportPackage(params: {
  audioWavUrl: string;
  audioMp3Url: string;
  coverArtUrl: string;
  title: string;
  artist: string;
  contributors: string[];
  genre: string;
  lyrics: string;
}): ExportPackage {
  return {
    audioWavUrl: params.audioWavUrl,
    audioMp3Url: params.audioMp3Url,
    coverArtUrl: params.coverArtUrl,
    metadata: {
      title: params.title,
      artist: params.artist,
      contributors: params.contributors,
      genre: params.genre,
      year: new Date().getFullYear(),
      isrcPlaceholder: 'PENDING',
    },
    lyricsText: params.lyrics,
  };
}
