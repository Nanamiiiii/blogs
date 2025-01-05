import { SatoriOptions } from "satori/wasm"
import { GlobalConfiguration, QuartzConfig } from "./quartz/cfg"
import { QuartzPluginData } from "./quartz/plugins/vfile"
import { SocialImageOptions, UserOpts } from "./quartz/util/og"
import * as Plugin from "./quartz/plugins"
/**
 * Quartz 4.0 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const ogpImageStructure: SocialImageOptions["imageStructure"] = (
  cfg: GlobalConfiguration,
  { colorScheme }: UserOpts,
  title: string,
  description: string,
  fonts: SatoriOptions["fonts"],
  _fileData: QuartzPluginData,
) => {
  // How many characters are allowed before switching to smaller font
  const fontBreakPoint = 22
  const descFontBreakPoint = 32
  const titleSize = title.length > fontBreakPoint ? 50 : 72
  const descSize = description.length > descFontBreakPoint ? 32 : 44

  // Setup to access image
  const iconPath = `https://${cfg.baseUrl}/static/icon.png`
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        width: "100%",
        backgroundColor: cfg.theme.colors[colorScheme].light,
        gap: "2rem",
        paddingTop: "1.5rem",
        paddingBottom: "1.5rem",
        paddingLeft: "5rem",
        paddingRight: "5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
          flexDirection: "row",
          gap: "2.5rem",
        }}
      >
        <p
          style={{
            color: cfg.theme.colors[colorScheme].dark,
            fontSize: titleSize,
            fontFamily: fonts[0].name,
          }}
        >
          {title}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          width: "100%",
          flexDirection: "row",
          gap: "2.5rem",
        }}
      >
        <p
          style={{
            color: cfg.theme.colors[colorScheme].dark,
            fontSize: descSize,
            lineClamp: 3,
            fontFamily: fonts[1].name,
          }}
        >
          {description}
        </p>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: "100%",
          flexDirection: "row",
          gap: "2.5rem",
        }}
      >
        <img src={iconPath} width={50} height={50} />
        <p
          style={{
            color: cfg.theme.colors[colorScheme].dark,
            fontSize: 30,
            lineClamp: 3,
            fontFamily: fonts[1].name,
            fontStyle: "italic",
          }}
        >
          Myuu's Trashcan
        </p>
      </div>
    </div>
  )
}

const config: QuartzConfig = {
  configuration: {
    pageTitle: "Myuu's Trashcan",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "en-US",
    baseUrl: "notes.myuu.dev",
    ignorePatterns: ["private", "templates", ".obsidian", "_config"],
    defaultDateType: "created",
    generateSocialImages: {
      colorScheme: "darkMode",
      imageStructure: ogpImageStructure,
    },
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        header: "M PLUS 1p",
        body: "IBM Plex Sans JP",
        code: "IBM Plex Mono",
      },
      colors: {
        lightMode: {
          light: "#f0f8fc",
          lightgray: "#e5e5e5",
          gray: "#b8b8b8",
          darkgray: "#4e4e4e",
          dark: "#2b2b2b",
          secondary: "#63B3EC",
          tertiary: "#a3d2f4",
          highlight: "rgba(99, 179, 236, 0.3)",
          textHighlight: "#fff23688",
        },
        darkMode: {
          light: "#161618",
          lightgray: "#393639",
          gray: "#646464",
          darkgray: "#d4d4d4",
          dark: "#ebebec",
          secondary: "#D1E9F9",
          tertiary: "#a3d2f4",
          highlight: "rgba(99, 179, 236, 0.3)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: true }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.HardLineBreaks(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.ExplicitPublish()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
