import { NextResponse } from 'next/server'
import { getSiteSettings } from '@/lib/sanity'

export const revalidate = 300

export async function GET() {
  const settings = await getSiteSettings()
  return NextResponse.json(settings)
}
