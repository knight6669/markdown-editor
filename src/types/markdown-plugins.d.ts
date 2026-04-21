declare module 'markdown-it-footnote' {
  import type { PluginSimple } from 'markdown-it'

  const plugin: PluginSimple
  export default plugin
}

declare module 'markdown-it-task-lists' {
  import type { PluginWithOptions } from 'markdown-it'

  type TaskListOptions = {
    enabled?: boolean
    label?: boolean
    labelAfter?: boolean
  }

  const plugin: PluginWithOptions<TaskListOptions>
  export default plugin
}
