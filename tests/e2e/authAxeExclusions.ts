/**
 * Known WCAG AA contrast failures on /auth.
 *
 * Each entry matches one element, not a whole axe rule. Anything else —
 * including every ARIA rule — still fails the check. Delete an entry when
 * its follow-up issue fixes that element.
 */
export interface AuthAxeExclusion {
  ruleId: string
  /** Contiguous snippet of the node's HTML. Keep this tighter than a shared class. */
  htmlIncludes: string
  issue: number
  reason: string
}

export const authAxeExclusions: readonly AuthAxeExclusion[] = [
  {
    ruleId: 'color-contrast',
    htmlIncludes: 'text-gray-400 uppercase tracking-wide',
    issue: 30,
    reason:
      'The welcome line under the title is 12px gray-400 (about 3.67:1 on mobile). #30 raises body text to WCAG AA 4.5:1.',
  },
  {
    ruleId: 'color-contrast',
    htmlIncludes: 'text-gray-500 font-pixel-body',
    issue: 30,
    reason:
      'The footer author line is 12px gray-500 (about 3.87:1). #30 raises body text to WCAG AA 4.5:1.',
  },
]

interface AxeNodeSnapshot {
  html: string
  target: readonly string[]
  failureSummary?: string
}

interface AxeViolationSnapshot {
  id: string
  help: string
  nodes: readonly AxeNodeSnapshot[]
}

export interface UnexpectedAxeViolation {
  ruleId: string
  help: string
  issue: string
  target: string
  html: string
  failureSummary?: string
}

function exclusionFor(ruleId: string, html: string): AuthAxeExclusion | undefined {
  return authAxeExclusions.find(
    (entry) => entry.ruleId === ruleId && html.includes(entry.htmlIncludes)
  )
}

export function unexpectedViolations(
  violations: readonly AxeViolationSnapshot[]
): UnexpectedAxeViolation[] {
  return violations.flatMap((violation) =>
    violation.nodes.flatMap((node) => {
      const exclusion = exclusionFor(violation.id, node.html)
      if (exclusion) return []
      return [{
        ruleId: violation.id,
        help: violation.help,
        issue: 'none — this node is not in tests/e2e/authAxeExclusions.ts',
        target: node.target.join(' '),
        html: node.html,
        failureSummary: node.failureSummary,
      }]
    })
  )
}
