import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { nanoid } from "nanoid"

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient()
    const adminId = nanoid()

    const { data: room, error } = await supabase
      .from("rooms")
      .insert({
        admin_id: adminId,
        votes_revealed: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating room:", error)
      return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
    }

    return NextResponse.json({
      roomId: room.id,
      adminId: adminId,
    })
  } catch (error) {
    console.error("[v0] Error in create room route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
