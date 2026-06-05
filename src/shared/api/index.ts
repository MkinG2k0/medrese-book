import { NextResponse } from "next/server"

export const success = <T>(data: T, status = 200) =>
  NextResponse.json({ data, error: null }, { status })

export const created = <T>(data: T) => success(data, 201)

export const error = (message: string, status = 400) =>
  NextResponse.json({ data: null, error: message }, { status })

export const unauthorized = () => error("Требуется авторизация", 401)

export const forbidden = () => error("Недостаточно прав", 403)

export const notFound = (entity = "Ресурс") =>
  error(`${entity} не найден`, 404)

export const serverError = (err: unknown) => {
  const message = err instanceof Error ? err.message : "Внутренняя ошибка сервера"
  if (process.env.NODE_ENV === "development") {
    console.error("[API Error]", err)
  }
  return error(message, 500)
}
