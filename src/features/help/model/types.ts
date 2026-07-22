export type HelpScreenshotRef = {
  src: string
  caption: string
}

/** Поле на экране: что значит и откуда берётся */
export type HelpFieldNote = {
  name: string
  meaning: string
  source: string
}

export type HelpHowToStep = {
  title: string
  description: string
  screenshotSrc?: string
  screenshotCaption?: string
}

/** Одна вкладка справки — одна фича */
export type HelpFeaturePage = {
  key: string
  title: string
  summary: string
  screenshots: HelpScreenshotRef[]
  fields?: HelpFieldNote[]
  howTo?: HelpHowToStep[]
  tips?: string[]
}

export type HelpGuide = {
  overview: {
    title: string
    description: string
  }
  features: HelpFeaturePage[]
}
