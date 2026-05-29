import type { Member } from '../types';

/** Derive up to two initials from a member name. */
export function initialsOf(member: Pick<Member, 'name' | 'avatarInitials'>): string {
  if (member.avatarInitials?.trim()) return member.avatarInitials.trim().slice(0, 2).toUpperCase();
  const parts = member.name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PlayerAvatar({
  member,
  size = 40,
  glow = true,
}: {
  member: Pick<Member, 'name' | 'avatarInitials' | 'displayColor'>;
  size?: number;
  glow?: boolean;
}) {
  return (
    <span
      className="inline-grid place-items-center rounded-full font-display font-bold shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        color: '#fff',
        background: `radial-gradient(circle at 30% 25%, ${member.displayColor}, ${member.displayColor}cc 60%, ${member.displayColor}99)`,
        border: `2px solid ${member.displayColor}`,
        boxShadow: glow ? `0 0 ${size * 0.4}px ${member.displayColor}66` : 'none',
      }}
      title={member.name}
    >
      {initialsOf(member)}
    </span>
  );
}
