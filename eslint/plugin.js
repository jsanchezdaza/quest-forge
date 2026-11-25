const DIRECTIVE = /^(?:eslint-disable(?:-next-line|-line)?|eslint-enable|@ts-expect-error|@ts-ignore|@ts-nocheck|@(?:vitest|jest)(?:-[\w-]+)?)\b/

function meaningfulLines(comment) {
  return comment.value
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^\*+\s?/, '').trim())
    .filter((line) => line.length > 0)
}

function isReferenceDirective(comment) {
  return comment.type === 'Line' && /^\/\s*<reference\b/.test(comment.value.trim())
}

function isToolDirective(comment) {
  if (comment.type === 'Shebang') return true
  if (isReferenceDirective(comment)) return true
  const lines = meaningfulLines(comment)
  return lines.length > 0 && lines.every((line) => DIRECTIVE.test(line))
}

const noComments = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow comments other than tool directives.',
    },
    schema: [],
    messages: {
      unexpected: 'Comments are not allowed.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (isToolDirective(comment)) continue
          context.report({ loc: comment.loc, messageId: 'unexpected' })
        }
      },
    }
  },
}

const plugin = {
  meta: { name: 'local' },
  rules: {
    'no-comments': noComments,
  },
}

export default plugin
