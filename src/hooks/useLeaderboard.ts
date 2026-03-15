import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

import { GAME_SCORE_KIND, GAME_TAG } from '@/lib/gameConstants';
import { getCurrentWeekStart, getCurrentWeekEnd, getPreviousWeekStart, getPreviousWeekEnd } from '@/lib/weekUtils';
import type { LeaderboardEntry, WeeklyWinner } from '@/lib/gameTypes';

function isValidGameScoreEvent(event: NostrEvent): boolean {
  const scoreTag = event.tags.find(([name]) => name === 'score')?.[1];
  const lightningTag = event.tags.find(([name]) => name === 'lightning')?.[1];
  const gameTag = event.tags.find(([name, value]) => name === 't' && value === GAME_TAG);

  if (!scoreTag || !lightningTag || !gameTag) return false;

  const score = parseInt(scoreTag, 10);
  return !isNaN(score) && score >= 0;
}

function eventToEntry(event: NostrEvent): LeaderboardEntry | null {
  if (!isValidGameScoreEvent(event)) return null;

  const scoreTag = event.tags.find(([name]) => name === 'score')?.[1];
  const lightningTag = event.tags.find(([name]) => name === 'lightning')?.[1];

  if (!scoreTag || !lightningTag) return null;

  return {
    lightning: lightningTag,
    score: parseInt(scoreTag, 10),
    timestamp: event.created_at,
    eventId: event.id,
  };
}

export function useTotalPlayCount() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['leaderboard', 'plays', 'total'],
    queryFn: async () => {
      const BATCH_SIZE = 400;
      const MAX_BATCHES = 30;

      const uniqueEventIds = new Set<string>();
      let until: number | undefined;

      for (let batch = 0; batch < MAX_BATCHES; batch++) {
        const events = await nostr.query([{
          kinds: [GAME_SCORE_KIND],
          '#t': [GAME_TAG],
          limit: BATCH_SIZE,
          ...(until ? { until } : {}),
        }]);

        if (events.length === 0) break;

        for (const event of events) {
          if (isValidGameScoreEvent(event)) {
            uniqueEventIds.add(event.id);
          }
        }

        const oldestCreatedAt = events.reduce((min, event) => Math.min(min, event.created_at), Number.POSITIVE_INFINITY);
        if (!Number.isFinite(oldestCreatedAt)) break;

        until = oldestCreatedAt - 1;

        if (events.length < BATCH_SIZE) break;
      }

      return uniqueEventIds.size;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useCurrentWeekLeaderboard() {
  const { nostr } = useNostr();
  const weekStart = getCurrentWeekStart();
  const weekEnd = getCurrentWeekEnd();

  return useQuery({
    queryKey: ['leaderboard', 'current', weekStart],
    queryFn: async () => {
      const events = await nostr.query([{
        kinds: [GAME_SCORE_KIND],
        '#t': [GAME_TAG],
        since: weekStart,
        until: weekEnd,
        limit: 200,
      }]);

      const entries = events
        .map(eventToEntry)
        .filter((e): e is LeaderboardEntry => e !== null)
        .sort((a, b) => b.score - a.score);

      // Top 10 unique lightning addresses (highest score per player)
      const seen = new Set<string>();
      const top10: LeaderboardEntry[] = [];
      for (const entry of entries) {
        if (!seen.has(entry.lightning)) {
          seen.add(entry.lightning);
          top10.push(entry);
          if (top10.length >= 10) break;
        }
      }

      return top10;
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function usePreviousWeekWinner() {
  const { nostr } = useNostr();
  const prevStart = getPreviousWeekStart();
  const prevEnd = getPreviousWeekEnd();

  return useQuery({
    queryKey: ['leaderboard', 'winner', prevStart],
    queryFn: async () => {
      const events = await nostr.query([{
        kinds: [GAME_SCORE_KIND],
        '#t': [GAME_TAG],
        since: prevStart,
        until: prevEnd,
        limit: 200,
      }]);

      const entries = events
        .map(eventToEntry)
        .filter((e): e is LeaderboardEntry => e !== null)
        .sort((a, b) => b.score - a.score);

      if (entries.length === 0) return null;

      // Deduplicate by lightning address, take highest score
      const seen = new Set<string>();
      for (const entry of entries) {
        if (!seen.has(entry.lightning)) {
          const winner: WeeklyWinner = {
            lightning: entry.lightning,
            score: entry.score,
            weekStart: prevStart,
            weekEnd: prevEnd,
          };
          return winner;
        }
        seen.add(entry.lightning);
      }

      return null;
    },
    staleTime: 60000 * 5, // 5 minutes
  });
}
