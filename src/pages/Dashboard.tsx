import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CalendarPlus,
  UserPlus,
  Dumbbell,
  Trophy,
  Activity,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useStore } from '../lib/storeContext';
import { classVolume } from '../lib/stats';

export function Dashboard() {
  const { data } = useStore();

  const activeMembers = data.members.filter((m) => !m.archived);
  const finishedClasses = data.classes.filter((c) => c.status === 'finished');
  const recent = [...data.classes]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const totalReps = finishedClasses.reduce((sum, c) => {
    const s = data.sessions[c.id];
    return sum + (s ? classVolume(s).reps : 0);
  }, 0);

  const stats = [
    { label: 'Active members', value: activeMembers.length, icon: UserPlus },
    { label: 'Classes run', value: data.classes.length, icon: Activity },
    { label: 'Finished', value: finishedClasses.length, icon: Trophy },
    { label: 'Total reps logged', value: totalReps, icon: Dumbbell },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back, trainer. Here's the floor at a glance."
      />

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="flex items-center gap-4">
              <div className="grid place-items-center h-12 w-12 rounded-xl bg-brand/15 border border-brand/25 text-brand-light shrink-0">
                <Icon size={22} />
              </div>
              <div>
                <div className="numeric text-3xl text-text-primary leading-none">
                  {value}
                </div>
                <div className="text-text-muted text-xs mt-1">{label}</div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <Card className="lg:col-span-1">
          <h3 className="text-2xl text-text-primary mb-4">Quick actions</h3>
          <div className="space-y-3">
            <Link
              to="/classes"
              className="flex items-center gap-3 p-4 rounded-xl bg-brand/15 border border-brand/30 hover:bg-brand/25 transition-colors group"
            >
              <CalendarPlus className="text-brand-light" size={22} />
              <div className="flex-1">
                <div className="font-medium text-text-primary">New class</div>
                <div className="text-xs text-text-muted">
                  Set up a Snakes &amp; Ladders session
                </div>
              </div>
              <ChevronRight
                className="text-text-muted group-hover:translate-x-0.5 transition-transform"
                size={18}
              />
            </Link>
            <Link
              to="/members"
              className="flex items-center gap-3 p-4 rounded-xl bg-surface-2 border border-border hover:border-brand-light/40 transition-colors group"
            >
              <UserPlus className="text-brand-light" size={22} />
              <div className="flex-1">
                <div className="font-medium text-text-primary">Add member</div>
                <div className="text-xs text-text-muted">
                  Grow the permanent roster
                </div>
              </div>
              <ChevronRight
                className="text-text-muted group-hover:translate-x-0.5 transition-transform"
                size={18}
              />
            </Link>
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2">
          <h3 className="text-2xl text-text-primary mb-4">Recent classes</h3>
          {recent.length === 0 ? (
            <div className="text-text-muted text-sm py-8 text-center">
              No classes yet. Create your first class to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/classes/${c.id}`}
                    className="flex items-center justify-between py-3.5 group"
                  >
                    <div>
                      <div className="font-medium text-text-primary group-hover:text-brand-light transition-colors">
                        {c.name}
                      </div>
                      <div className="text-xs text-text-muted">
                        {c.date} · {c.participantIds.length} players
                      </div>
                    </div>
                    <Badge
                      tone={
                        c.status === 'finished'
                          ? 'success'
                          : c.status === 'in_progress'
                            ? 'warning'
                            : 'neutral'
                      }
                    >
                      {c.status.replace('_', ' ')}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
