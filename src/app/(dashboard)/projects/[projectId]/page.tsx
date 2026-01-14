'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Countdown } from '@/components/ui/countdown';
import { InviteModal } from '@/components/dashboard/invite-modal';
import { SubmissionCard } from '@/components/dashboard/submission-card';
import { GenerationPanel } from '@/components/dashboard/generation-panel';
import type { ProjectDashboard, Submission } from '@/types';

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await fetch(
        `/api/v1/projects/${resolvedParams.projectId}/dashboard`
      );
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to fetch dashboard');
      }
      const data = await response.json();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [resolvedParams.projectId]);

  const handleApproveSubmission = async (submissionId: string) => {
    try {
      await fetch(`/api/v1/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to approve submission:', err);
    }
  };

  const handleExcludeSubmission = async (submissionId: string) => {
    try {
      await fetch(`/api/v1/submissions/${submissionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'excluded' }),
      });
      fetchDashboard();
    } catch (err) {
      console.error('Failed to exclude submission:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </Card>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { project, invites_sent, submissions_received, submissions, revisions_remaining, latest_version } = dashboard;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Song for {project.honoree_name}
          </h1>
          <p className="text-gray-600">
            {project.occasion} • {project.honoree_relationship}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Countdown */}
      {project.status === 'collecting' && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-medium text-gray-900">Time Remaining</h2>
              <p className="text-sm text-gray-600">
                Contributors can submit memories until the deadline
              </p>
            </div>
            <Countdown deadline={project.deadline_timestamp} size="md" />
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Invites Sent"
          value={invites_sent}
          action={
            <Button size="sm" onClick={() => setShowInviteModal(true)}>
              Invite More
            </Button>
          }
        />
        <StatCard
          label="Submissions"
          value={submissions_received}
        />
        <StatCard
          label="Revisions Remaining"
          value={revisions_remaining}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Submissions */}
        <div className="lg:col-span-2 space-y-4">
          <CardHeader
            title="Submissions"
            description="Review and curate memories from contributors"
          />
          {submissions.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-gray-500 mb-4">No submissions yet</p>
              <Button onClick={() => setShowInviteModal(true)}>
                Invite Contributors
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission: Submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  onApprove={() => handleApproveSubmission(submission.id)}
                  onExclude={() => handleExcludeSubmission(submission.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Generation Panel */}
        <div>
          <GenerationPanel
            projectId={project.id}
            status={project.status}
            latestVersion={latest_version}
            revisionsRemaining={revisions_remaining}
            submissionsCount={submissions_received}
            onGenerate={fetchDashboard}
          />
        </div>
      </div>

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        projectId={project.id}
        onInvitesSent={fetchDashboard}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-gray-100 text-gray-700',
    collecting: 'bg-blue-100 text-blue-700',
    curating: 'bg-yellow-100 text-yellow-700',
    generating: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
  };

  const labels = {
    draft: 'Draft',
    collecting: 'Collecting Memories',
    curating: 'Curating',
    generating: 'Generating Song',
    completed: 'Completed',
  };

  return (
    <span
      className={`px-3 py-1.5 text-sm font-medium rounded-full ${
        styles[status as keyof typeof styles] || styles.draft
      }`}
    >
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

function StatCard({
  label,
  value,
  action,
}: {
  label: string;
  value: number;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {action}
      </div>
    </Card>
  );
}
