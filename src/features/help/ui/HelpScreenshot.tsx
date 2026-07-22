import Text from '@/shared/ui/Text'

type HelpScreenshotProps = {
  src: string
  caption?: string
  alt: string
}

export function HelpScreenshot({ src, caption, alt }: HelpScreenshotProps) {
  return (
    <figure className="my-3 flex flex-col gap-2">
      <img
        src={src}
        alt={alt}
        width={960}
        height={540}
        className="h-auto w-full max-w-3xl rounded-lg border border-border"
      />
      {caption ? (
        <Text type="secondary" className="block">
          {caption}
        </Text>
      ) : null}
    </figure>
  )
}
