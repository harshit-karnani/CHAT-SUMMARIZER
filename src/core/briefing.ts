import type {
  Briefing,
  BriefingItem,
  Message,
  ParsedChat,
  Signal,
  TriageResult,
  UserContext,
} from '../types';
import { triage } from './triage';

function cleanText(text: string, maxLen: number): string {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLen) return singleLine;
  return `${singleLine.slice(0, maxLen - 3)}...`;
}

function formatDueShort(ts: number): string {
  const d = new Date(ts);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  return `${weekday} ${day} ${month}, ${time}`;
}

function buildSummary(
  sender: string,
  kind: BriefingItem['kind'],
  strongestMsg: Message,
  dueAt?: number
): string {
  const snippet = cleanText(strongestMsg.text, 65);
  if (kind === 'needs_you') {
    if (dueAt) {
      return `${sender} requested "${snippet}" (due ${formatDueShort(dueAt)}).`;
    }
    return `${sender} asked you: "${snippet}".`;
  }
  if (kind === 'deadline') {
    const dueStr = dueAt ? ` (due ${formatDueShort(dueAt)})` : '';
    return `${sender} flagged deadline: "${snippet}"${dueStr}.`;
  }
  if (kind === 'decision') {
    return `${sender} confirmed decision: "${snippet}".`;
  }
  return `${sender} shared update: "${snippet}".`;
}

export function buildBriefing(chat: ParsedChat, user: UserContext): Briefing {
  const allMessages = chat.messages;
  const slice = allMessages.filter((m) => m.ts > user.lastReadAt);

  const triageResults = triage(allMessages, user);
  const triageMap = new Map<number, TriageResult>();
  for (const tr of triageResults) {
    triageMap.set(tr.messageId, tr);
  }

  // Filter candidates in the slice with score >= 25
  const candidates: { msg: Message; triage: TriageResult }[] = [];
  for (const msg of slice) {
    const tr = triageMap.get(msg.id);
    if (!tr) continue;
    if (tr.score >= 25 || tr.signals.includes('decision')) {
      if (tr.signals.includes('decision') && tr.score < 25) {
        tr.score = 25;
      }
      candidates.push({ msg, triage: tr });
    }
  }

  // Cluster consecutive candidates within 15 minutes
  const clusters: { msg: Message; triage: TriageResult }[][] = [];
  let currentCluster: { msg: Message; triage: TriageResult }[] = [];

  for (const cand of candidates) {
    if (currentCluster.length === 0) {
      currentCluster.push(cand);
    } else {
      const prev = currentCluster[currentCluster.length - 1];
      if (cand.msg.ts - prev.msg.ts <= 15 * 60 * 1000) {
        currentCluster.push(cand);
      } else {
        clusters.push(currentCluster);
        currentCluster = [cand];
      }
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  // Convert clusters to BriefingItems
  const items: BriefingItem[] = [];

  for (let idx = 0; idx < clusters.length; idx++) {
    const cluster = clusters[idx];
    const sourceMessageIds = cluster.map((c) => c.msg.id);

    // Pick strongest message
    let strongest = cluster[0];
    for (const c of cluster) {
      if (c.triage.score > strongest.triage.score) {
        strongest = c;
      }
    }

    const allSignals: Signal[] = Array.from(
      new Set(cluster.flatMap((c) => c.triage.signals))
    );
    const allReasons: string[] = Array.from(
      new Set(cluster.flatMap((c) => c.triage.reasons))
    );

    // Determine dueAt (earliest valid dueAt)
    const validDueAts = cluster
      .map((c) => c.triage.dueAt)
      .filter((d): d is number => typeof d === 'number');
    const dueAt = validDueAts.length > 0 ? Math.min(...validDueAts) : undefined;

    // Determine kind
    let kind: BriefingItem['kind'] = 'fyi';
    if (allSignals.includes('mention') || allSignals.includes('direct_question')) {
      kind = 'needs_you';
    } else if (allSignals.includes('deadline')) {
      kind = 'deadline';
    } else if (allSignals.includes('decision')) {
      kind = 'decision';
    }

    const title = cleanText(strongest.msg.text, 70);
    const summary = buildSummary(strongest.msg.sender, kind, strongest.msg, dueAt);
    const reason = allReasons.join(' · ');

    items.push({
      id: `item-${idx + 1}-${sourceMessageIds[0]}`,
      kind,
      title,
      summary,
      reason,
      score: strongest.triage.score,
      sourceMessageIds,
      dueAt,
      signals: allSignals,
    });
  }

  // Sorting: needs_you, then deadline (by dueAt asc), decision, fyi; within a kind by score desc
  const kindPriority: Record<BriefingItem['kind'], number> = {
    needs_you: 1,
    deadline: 2,
    decision: 3,
    fyi: 4,
  };

  items.sort((a, b) => {
    if (kindPriority[a.kind] !== kindPriority[b.kind]) {
      return kindPriority[a.kind] - kindPriority[b.kind];
    }
    if (a.kind === 'deadline') {
      const dueA = a.dueAt ?? Number.MAX_SAFE_INTEGER;
      const dueB = b.dueAt ?? Number.MAX_SAFE_INTEGER;
      if (dueA !== dueB) return dueA - dueB;
    }
    return b.score - a.score;
  });

  const clusteredIds = new Set(items.flatMap((i) => i.sourceMessageIds));
  const noiseCount = slice.filter((m) => !clusteredIds.has(m.id)).length;
  const missedCount = slice.length;

  const counts: Record<BriefingItem['kind'], number> = {
    needs_you: 0,
    deadline: 0,
    decision: 0,
    fyi: 0,
  };
  for (const item of items) {
    counts[item.kind]++;
  }

  return {
    items,
    counts,
    noiseCount,
    missedCount,
    slice: {
      from: slice[0]?.ts ?? user.lastReadAt,
      to: slice[slice.length - 1]?.ts ?? user.lastReadAt,
    },
    chatSpan: {
      from: allMessages[0]?.ts ?? 0,
      to: allMessages[allMessages.length - 1]?.ts ?? 0,
    },
  };
}
