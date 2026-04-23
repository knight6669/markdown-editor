import type { MarkdownOutlineItem } from '../types/editor'

export type PreviewAnchor = {
  element: HTMLElement
  lineStart: number
  lineEnd: number
  slug: string | null
  depth: number
  order: number
}

export function findPreviewHeadingElement(
  container: HTMLElement,
  slug: string | null,
) {
  if (!slug) {
    return null
  }

  const escapedSlug = escapeAttributeValue(slug)
  return container.querySelector<HTMLElement>(
    `[data-heading-slug="${escapedSlug}"], [id="${escapedSlug}"]`,
  )
}

export function scrollPreviewHeadingIntoView(
  container: HTMLElement,
  slug: string | null,
) {
  const headingElement = findPreviewHeadingElement(container, slug)
  if (!headingElement) {
    return false
  }

  const top = getElementTopWithinContainer(container, headingElement, 18)
  if (typeof container.scrollTo === 'function') {
    container.scrollTo({
      top,
      behavior: 'smooth',
    })
  } else {
    container.scrollTop = top
  }
  return true
}

export function collectPreviewAnchors(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('.md-source-block[data-source-line]'),
  ).map((element, order) => {
    const lineStart = Number(element.dataset.sourceLine)
    const lineEnd = Number(element.dataset.sourceLineEnd ?? lineStart)

    return {
      element,
      lineStart,
      lineEnd: Number.isFinite(lineEnd) ? Math.max(lineStart, lineEnd) : lineStart,
      slug: element.dataset.headingSlug ?? null,
      depth: getElementDepthWithin(container, element),
      order,
    }
  })
}

export function scrollPreviewAnchorIntoView(
  container: HTMLElement,
  anchor: PreviewAnchor,
  behavior: ScrollBehavior = 'auto',
) {
  const headingElement = findPreviewHeadingElement(container, anchor.slug)
  const targetElement = headingElement ?? anchor.element
  const top = getElementTopWithinContainer(container, targetElement, 18)

  if (behavior === 'auto') {
    container.scrollTop = top
  } else if (typeof container.scrollTo === 'function') {
    container.scrollTo({
      top,
      behavior,
    })
  } else {
    container.scrollTop = top
  }

  return top
}

export function getPreviewTargetTopForLine(
  container: HTMLElement,
  anchors: PreviewAnchor[],
  lineStart: number,
) {
  const anchor = findPreviewAnchorForLine(anchors, lineStart)
  if (!anchor) {
    return null
  }

  const currentElement =
    findPreviewHeadingElement(container, anchor.slug) ?? anchor.element
  const currentTop = getElementTopWithinContainer(container, currentElement, 18)
  const nextAnchor = anchors.find((candidate) => candidate.order > anchor.order)

  if (!nextAnchor) {
    return currentTop
  }

  const nextElement =
    findPreviewHeadingElement(container, nextAnchor.slug) ?? nextAnchor.element
  const nextTop = getElementTopWithinContainer(container, nextElement, 18)
  const lineSpan = Math.max(nextAnchor.lineStart - anchor.lineStart, 1)
  const progress = clamp((lineStart - anchor.lineStart) / lineSpan, 0, 1)

  return currentTop + (nextTop - currentTop) * progress
}

export function findPreviewAnchorForLine(anchors: PreviewAnchor[], lineStart: number) {
  if (anchors.length === 0) {
    return null
  }

  let containing: PreviewAnchor | null = null
  let previous: PreviewAnchor | null = null
  let next: PreviewAnchor | null = null

  for (const current of anchors) {
    if (current.lineStart <= lineStart) {
      previous = current
    } else if (!next) {
      next = current
    }

    if (current.lineStart <= lineStart && current.lineEnd >= lineStart) {
      if (!containing || isBetterAnchorMatch(current, containing)) {
        containing = current
      }
    }
  }

  return containing ?? previous ?? next ?? anchors[0]
}

export function findPreviewAnchorForScrollTop(
  anchors: PreviewAnchor[],
  scrollTop: number,
) {
  if (anchors.length === 0) {
    return null
  }

  let match = anchors[0]

  for (const current of anchors) {
    if (current.element.offsetTop <= scrollTop + 24) {
      match = current
      continue
    }

    break
  }

  return match
}

export function getActiveOutlineSlug(
  outline: MarkdownOutlineItem[],
  activeSourceLine: number,
) {
  let activeSlug: string | null = outline[0]?.slug ?? null

  for (const heading of outline) {
    if (heading.lineStart <= activeSourceLine) {
      activeSlug = heading.slug
    } else {
      break
    }
  }

  return activeSlug
}

function escapeAttributeValue(value: string) {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function getElementTopWithinContainer(
  container: HTMLElement,
  element: HTMLElement,
  offset = 0,
) {
  const containerRect = container.getBoundingClientRect()
  const elementRect = element.getBoundingClientRect()
  return Math.max(
    container.scrollTop + (elementRect.top - containerRect.top) - offset,
    0,
  )
}

function getElementDepthWithin(container: HTMLElement, element: HTMLElement) {
  let depth = 0
  let current = element.parentElement

  while (current && current !== container) {
    depth += 1
    current = current.parentElement
  }

  return depth
}

function isBetterAnchorMatch(candidate: PreviewAnchor, current: PreviewAnchor) {
  const candidateSpan = candidate.lineEnd - candidate.lineStart
  const currentSpan = current.lineEnd - current.lineStart

  if (candidateSpan !== currentSpan) {
    return candidateSpan < currentSpan
  }

  if (candidate.depth !== current.depth) {
    return candidate.depth > current.depth
  }

  if (candidate.lineStart !== current.lineStart) {
    return candidate.lineStart > current.lineStart
  }

  return candidate.order > current.order
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
