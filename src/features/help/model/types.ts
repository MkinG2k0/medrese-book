export type HelpStep = {
  title: string
  description: string
  screenshotSrc?: string
  screenshotCaption?: string
}

export type HelpWalkthrough = {
  title: string
  description: string
  steps: HelpStep[]
}

export type HelpFeature = {
  title: string
  description: string
  screenshotSrc?: string
  screenshotCaption?: string
}

export type HelpGuide = {
  overview: {
    title: string
    description: string
  }
  features: HelpFeature[]
  walkthroughs: HelpWalkthrough[]
}
