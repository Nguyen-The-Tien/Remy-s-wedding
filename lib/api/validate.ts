import { NextResponse } from "next/server"
import type { ZodType, z } from "zod"

export async function parseJsonBody<T extends ZodType>(
  request: Request,
  schema: T
): Promise<{ data: z.infer<T> } | { error: NextResponse }> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    return {
      error: NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      ),
    }
  }

  return { data: result.data }
}
