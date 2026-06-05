import EasyYandexS3 from 'easy-yandex-s3'

const BUCKET = process.env.S3_BUCKET ?? ''

const s3 = new EasyYandexS3({
	auth: {
		accessKeyId: process.env.S3_ACCESS_KEY ?? '',
		secretAccessKey: process.env.S3_SECRET_KEY ?? '',
	},
	Bucket: BUCKET,
	debug: process.env.NODE_ENV === 'development',
})

export const uploadToS3 = async (
	key: string,
	body: Buffer,
	path: string = '/venues/',
): Promise<string> => {
	const uploadResult = await s3.Upload(
		{
			buffer: body,
			name: key,
		},
		path,
	)

	if (!uploadResult || typeof uploadResult !== 'object') {
		throw new Error('Не удалось загрузить файл в Object Storage')
	}

	// Библиотека возвращает Location с полным URL
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const location = (uploadResult as any).Location as string | undefined
	if (!location) {
		throw new Error('Object Storage не вернул ссылку на файл')
	}

	return location
}

export const deleteFromS3 = async (key: string): Promise<void> => {
	const result = await s3.Remove(key)
	if (!result) {
		throw new Error('Не удалось удалить файл из Object Storage')
	}
}

export const getS3Url = (key: string): string => {
	const endpoint = process.env.S3_ENDPOINT ?? 'https://storage.yandexcloud.net'
	return `${endpoint}/${BUCKET}/${key}`
}
