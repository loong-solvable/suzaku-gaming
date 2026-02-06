// vue-router RouteMeta 类型扩展
// 注意：必须有 import/export 使文件成为模块，
// 这样 declare module 才是"模块增强"而非"环境声明"
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    breadcrumb?: string[]
    hidden?: boolean
    keepAlive?: boolean
  }
}
