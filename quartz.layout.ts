import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [],
  footer: Component.Footer({
    links: {
      Twitter: "https://twitter.com/Nanamii_i",
      GitHub: "https://github.com/Nanamiiiii",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(
      Component.Explorer({
        sortFn: (a, b) => {
          if ((!a.file && !b.file) || (a.file && b.file)) {
            if (a.file?.dates?.created && b.file?.dates?.created) {
              return a.file.dates.created < b.file.dates.created ? 1 : -1
            }
            if (a.file?.dates?.created && !b.file?.dates?.created) {
              return 1
            } else {
              return -1
            }
          }
          if (a.file && !b.file) {
            return 1
          } else {
            return -1
          }
        },
        filterFn: (node) => {
          if (node.file) {
            return node.name !== "tags" && node.file?.frontmatter?.invisible !== true
          } else {
            return node.name !== "Misc"
          }
        },
      }),
    ),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Search(),
    Component.Darkmode(),
    Component.DesktopOnly(Component.Explorer()),
  ],
  right: [],
}
