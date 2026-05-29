import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowDownRight,
  Dumbbell,
  Timer,
  CalendarDays,
  Crown,
  Flame,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { useStore } from '../lib/storeContext';
import { formatMs, memberHistory, memberLifetime } from '../lib/stats';

const AXIS = { stroke: 'var(--text-muted)', fontSize: 12 };
const GRID = 'rgba(255,255,255,0.06)';

export function MemberProfile() {
  const { memberId } = useParams();
  const { data } = useStore();
  const member = data.members.find((m) => m.id === memberId);

  const history = useMemo(
    () => (memberId ? memberHistory(data.classes, data.sessions, memberId) : []),
    [data.classes, data.sessions, memberId],
  );
  const lifetime = useMemo(() => memberLifetime(history), [history]);

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted mb-4">Member not found.</p>
        <Link to="/members">
          <Button variant="secondary">Back to members</Button>
        </Link>
      </div>
    );
  }

  const chartData = history.map((p) => ({
    name: p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name,
    date: p.date,
    volume: p.volumeTotal,
    avgSecs: p.avgMs > 0 ? +(p.avgMs / 1000).toFixed(1) : null,
  }));

  const totals = [
    { icon: CalendarDays, label: 'Classes played', value: lifetime.classesPlayed },
    { icon: Dumbbell, label: 'Lifetime reps', value: lifetime.totalReps },
    { icon: Timer, label: 'Exercise seconds', value: lifetime.totalSeconds },
    { icon: Crown, label: 'Wins', value: lifetime.wins },
  ];

  return (
    <div>
      <Link
        to="/members"
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-5"
      >
        <ArrowLeft size={16} /> All members
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <PlayerAvatar member={member} size={72} />
        <div>
          <h1 className="text-4xl sm:text-5xl text-text-primary uppercase leading-none">
            {member.name}
          </h1>
          <p className="text-brand-light font-display font-bold uppercase tracking-wide mt-1">
            Getting stronger. Getting faster.
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <Card className="mt-8">
          <EmptyState
            icon={<TrendingUp size={32} />}
            title="No classes played yet"
            message={`Once ${member.name} plays a class, their progress and personal records will appear here.`}
            action={
              <Link to="/classes">
                <Button>Go to classes</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          {/* Lifetime totals */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            {totals.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="flex items-center gap-3">
                <div className="grid place-items-center h-11 w-11 rounded-xl bg-brand/15 border border-brand/25 text-brand-light shrink-0">
                  <Icon size={20} />
                </div>
                <div>
                  <div className="numeric text-2xl text-text-primary leading-none">
                    {value}
                  </div>
                  <div className="text-text-muted text-xs mt-1">{label}</div>
                </div>
              </Card>
            ))}
          </div>

          {/* Personal records */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Card className="flex items-center gap-3 border-warning/30">
              <Flame className="text-warning" size={24} />
              <div>
                <div className="text-text-muted text-xs">Highest single-class volume</div>
                <div className="numeric text-2xl text-text-primary">
                  {lifetime.bestVolume}
                </div>
              </div>
            </Card>
            <Card className="flex items-center gap-3 border-success/30">
              <Timer className="text-success" size={24} />
              <div>
                <div className="text-text-muted text-xs">Fastest avg exercise time</div>
                <div className="numeric text-2xl text-text-primary">
                  {lifetime.fastestMs != null ? formatMs(lifetime.fastestMs) : '—'}
                </div>
              </div>
            </Card>
          </div>

          {/* Volume trend */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="text-brand-light" size={20} />
              <h3 className="text-2xl text-text-primary">Workout volume per class</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis tick={AXIS} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(123,45,139,0.12)' }}
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar
                  dataKey="volume"
                  name="Volume (reps + secs)"
                  fill="var(--brand-purple)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Speed trend — lower is better */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Timer className="text-success" size={20} />
                <h3 className="text-2xl text-text-primary">
                  Average completion time
                </h3>
              </div>
              <span className="flex items-center gap-1 text-success text-sm">
                <ArrowDownRight size={16} /> lower = fitter
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={AXIS} axisLine={{ stroke: GRID }} tickLine={false} />
                <YAxis
                  tick={AXIS}
                  axisLine={false}
                  tickLine={false}
                  unit="s"
                />
                <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'var(--text-primary)' }} />
                <Line
                  type="monotone"
                  dataKey="avgSecs"
                  name="Avg time (s)"
                  stroke="var(--success)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--success)', r: 4 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}

const tooltipStyle = {
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text-primary)',
};
