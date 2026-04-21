import type { MarkdownOutlineItem } from '../types/editor'

export type PreviewAnchor = {
  lineStart: number
  top: number
  slug: string | null
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

  headingElement.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest',
  })
  return true
}

export function collectPreviewAnchors(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>('.md-source-block[data-source-line]'),
  ).map((element) => ({
    lineStart: Number(element.dataset.sourceLine),
    top: element.offsetTop,
    slug: element.dataset.headingSlug ?? null,
  }))
}

export function findPreviewAnchorForLine(anchors: PreviewAnchor[], lineStart: number) {
  if (anchors.length === 0) {
    return null
  }

  let low = 0
  let high = anchors.length - 1
  let match = anchors[0]

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const current = anchors[mid]

    if (current.lineStart <= lineStart) {
      match = current
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return match
}

export function findPreviewAnchorForScrollTop(
  anchors: PreviewAnchor[],
  scrollTop: number,
) {
  if (anchors.length === 0) {
    return null
  }

  let low = 0
  let high = anchors.length - 1
  let match = anchors[0]

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const current = anchors[mid]

    if (current.top <= scrollTop + 24) {
      match = current
      low = mid + 1
    } else {
      high = mid - 1
    }
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
