import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              SongTribute
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
                Sign in
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Create a song from{' '}
              <span className="text-indigo-600">everyone&apos;s memories</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Collect stories, inside jokes, and heartfelt messages from friends
              and family. We&apos;ll turn them into a professional song they&apos;ll treasure
              forever.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto px-8">
                  Create Your First Song
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Preview mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-w-4xl mx-auto">
              <div className="h-8 bg-gray-100 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">8 Contributors</h3>
                    <p className="text-sm text-gray-500">Sharing memories</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">48h Remaining</h3>
                    <p className="text-sm text-gray-500">To submit</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-100 rounded-lg mb-3 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-gray-900">Song Ready</h3>
                    <p className="text-sm text-gray-500">After curation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div id="how-it-works" className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <div key={step.title} className="text-center">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-indigo-600">{index + 1}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-32 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to create something special?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start collecting memories today. Your personalized song is just a few clicks away.
          </p>
          <Link href="/register">
            <Button size="lg" className="px-8">
              Get Started Free
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              SongTribute - Create personalized songs from collective memories
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-900">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

const STEPS = [
  {
    title: 'Create Your Project',
    description: 'Set the tone, choose the music style, and customize the song for your honoree.',
  },
  {
    title: 'Invite Contributors',
    description: 'Send invites via email or SMS. Contributors have 72 hours to share memories.',
  },
  {
    title: 'Curate & Generate',
    description: 'Review submissions, highlight favorites, and generate your personalized song.',
  },
  {
    title: 'Share & Celebrate',
    description: 'Download your song or distribute it directly to Spotify for everyone to enjoy.',
  },
];

const FEATURES = [
  {
    title: 'AI-Powered Generation',
    description: 'Our AI transforms memories into professional-quality songs with meaningful lyrics.',
    icon: <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  },
  {
    title: '72-Hour Countdown',
    description: 'Creates urgency while giving everyone enough time to contribute meaningful memories.',
    icon: <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    title: 'Easy Contribution',
    description: 'No account needed. Contributors share memories in 60-90 seconds via simple forms.',
    icon: <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>,
  },
  {
    title: 'Full Creative Control',
    description: 'Choose genres, tempo, vocal style, and curate which memories make it into the song.',
    icon: <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  },
  {
    title: 'Spotify Distribution',
    description: 'Automatically publish your song to Spotify with all contributors credited.',
    icon: <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  },
  {
    title: 'Revision Support',
    description: 'Not perfect on the first try? Iterate up to 3 times to get it just right.',
    icon: <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  },
];
