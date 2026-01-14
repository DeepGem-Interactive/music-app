import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCountdown } from '@/lib/utils';
import type { Project } from '@/types';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('host_user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Projects</h1>
          <p className="text-gray-600 mt-1">
            Create personalized songs for your loved ones
          </p>
        </div>
        <Link href="/projects/new">
          <Button>Create New Song</Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="text-center py-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No projects yet
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first personalized song by collecting memories from friends and family.
          </p>
          <Link href="/projects/new">
            <Button size="lg">Create Your First Song</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    collecting: 'bg-blue-100 text-blue-700',
    curating: 'bg-yellow-100 text-yellow-700',
    generating: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
  };

  const statusLabels = {
    draft: 'Draft',
    collecting: 'Collecting Memories',
    curating: 'Curating',
    generating: 'Generating',
    completed: 'Completed',
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer h-full">
        <CardHeader
          title={`Song for ${project.honoree_name}`}
          description={project.occasion}
        />
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status]}`}
            >
              {statusLabels[project.status]}
            </span>
          </div>

          {project.status === 'collecting' && (
            <p className="text-sm text-gray-500">
              {formatCountdown(project.deadline_timestamp)}
            </p>
          )}

          <p className="text-sm text-gray-600">
            {project.honoree_relationship} • {new Date(project.created_at).toLocaleDateString()}
          </p>
        </div>
      </Card>
    </Link>
  );
}
