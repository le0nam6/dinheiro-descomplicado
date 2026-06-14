import { NextResponse } from 'next/server'

export const revalidate = 300 // revalida a cada 5 min

export async function GET() {
  try {
    const listId = process.env.BREVO_LIST_ID || '2'
    const res = await fetch(`https://api.brevo.com/v3/contacts/lists/${listId}`, {
      headers: { 'api-key': process.env.BREVO_API_KEY! },
    })
    if (!res.ok) throw new Error('Brevo error')
    const data = await res.json()
    const count: number = data.uniqueSubscribers ?? data.totalSubscribers ?? 0
    return NextResponse.json({ count })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
