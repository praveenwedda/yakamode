import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Crown,
  Dumbbell,
  Timer,
  Zap,
  MapPin,
  Trophy,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { useStore } from '../lib/storeContext';
import { allMemberStats, formatMs, formatVolume } from '../lib/stats';
import type { MemberClassStats } from '../lib/stats';

type SortKey = 'volume' | 'speed' | 'position';

export function Results() {
  const { classId } = useParams();
  const { data, getClass, getSession } = useStore();
  const cls = classId ? getClass(classId) : undefined;
  const session = classId ? getSession(classId) : undefined;
  const [sort, setSort] = useState<SortKey>('position');

  const stats = useMemo(() => (session ? allMemberStats(session) : []), [session]);

  const sorted = useMemo(() => {
    const arr = [...stats];
    if (sort === 'volume') {
      arr.sort(
        (a, b) =>
          b.volume.reps + b.volume.seconds - (a.volume.reps + a.volume.seconds),
      );
    } else if (sort === 'speed') {
      arr.sort((a, b) => (a.timing.avgMs || Infinity) - (b.timing.avgMs || Infinity));
    } else {
      arr.sort((a, b) => {
        // Finished players first (by rank), then by board position.
        if (a.finishRank && b.finishRank) return a.finishRank - b.finishRank;
        if (a.finishRank) return -1;
        if (b.finishRank) return 1;
        return b.finalBox - a.finalBox;
      });
    }
    return arr;
  }, [stats, sort]);

  if (!cls || !session) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted mb-4">No results found for this class.</p>
        <Link to="/classes">
          <Button variant="secondary">Back to classes</Button>
        </Link>
      </div>
    );
  }

  const member = (id: string) => data.members.find((m) => m.id === id);
  const winner = session.winnerId ? member(session.winnerId) : null;

  return (
    <div>
      <Link
        to={`/classes/${cls.id}`}
        className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary text-sm mb-5"
      >
        <ArrowLeft size={16} /> Back to {cls.name}
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl sm:text-5xl text-text-primary uppercase">
            Results
          </h1>
          <p className="text-text-muted mt-1.5">
            {cls.name} · {cls.date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-text-muted text-sm">Sort by</span>
          {(['position', 'volume', 'speed'] as SortKey[]).map((k) => (
            <Button
              key={k}
              size="sm"
              variant={sort === k ? 'primary' : 'secondary'}
              onClick={() => setSort(k)}
            >
              {k === 'position' ? 'Position' : k === 'volume' ? 'Volume' : 'Speed'}
            </Button>
          ))}
        </div>
      </div>

      {/* Winner spotlight */}
      {winner && (
        <Card glow className="mb-6 flex items-center gap-4 border-warning/40">
          <Crown className="text-warning" size={32} />
          <PlayerAvatar member={winner} size={56} />
          <div>
            <div className="text-text-muted text-sm">Winner — first to 100</div>
            <div className="text-3xl text-text-primary font-display font-bold uppercase">
              {winner.name}
            </div>
          </div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {sorted.map((s, i) => {
          const m = member(s.memberId);
          if (!m) return null;
          return (
            <motion.div
              key={s.memberId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ScoreCard rank={i + 1} member={m} stats={s} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function ScoreCard({
  rank,
  member,
  stats,
}: {
  rank: number;
  member: { name: string; displayColor: string; avatarInitials?: string };
  stats: MemberClassStats;
}) {
  const rows = [
    {
      icon: Dumbbell,
      label: 'Workout volume',
      value: formatVolume(stats.volume),
    },
    {
      icon: Timer,
      label: 'Total active time',
      value: formatMs(stats.timing.totalActiveMs),
    },
    {
      icon: Zap,
      label: 'Avg / fastest',
      value:
        stats.timing.avgMs > 0
          ? `${formatMs(stats.timing.avgMs)} · ${formatMs(stats.timing.fastestMs ?? 0)}`
          : '—',
    },
    {
      icon: MapPin,
      label: 'Final box · rolls',
      value: `Box ${stats.finalBox} · ${stats.rolls} rolls`,
    },
  ];

  return (
    <Card className={stats.isWinner ? 'border-warning/40' : ''}>
      <div className="flex items-center gap-3 mb-4">
        <div className="numeric text-3xl text-text-muted w-8 text-center">{rank}</div>
        <PlayerAvatar member={member} size={48} />
        <div className="flex-1">
          <div className="font-display font-bold text-2xl text-text-primary uppercase leading-none">
            {member.name}
          </div>
          <div className="mt-1 flex gap-2">
            {stats.isWinner && (
              <Badge tone="warning">
                <Crown size={12} /> Winner
              </Badge>
            )}
            {stats.finishRank && !stats.isWinner && (
              <Badge tone="success">
                <Trophy size={12} /> Finished #{stats.finishRank}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-base/40 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-text-muted text-xs mb-1">
              <Icon size={13} /> {label}
            </div>
            <div className="numeric text-text-primary">{value}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
