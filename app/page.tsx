"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Clock, Crown, Trash2 } from "lucide-react"
import { getRoomHistory, addRoomToHistory, removeRoomFromHistory, type RoomHistoryItem } from "@/lib/room-history"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [isCreating, setIsCreating] = useState(false)
  const [roomHistory, setRoomHistory] = useState<RoomHistoryItem[]>([])
  const router = useRouter()

  useEffect(() => {
    setRoomHistory(getRoomHistory())
  }, [])

  const createRoom = async () => {
    setIsCreating(true)
    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to create room")
      }

      const data = await response.json()

      addRoomToHistory(data.roomId, true)

      router.push(`/room/${data.roomId}?admin=${data.adminId}`)
    } catch (error) {
      console.error("Error creating room:", error)
      alert("Failed to create room. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteRoom = (roomId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRoomFromHistory(roomId)
    setRoomHistory(getRoomHistory())
  }

  const handleRoomClick = (room: RoomHistoryItem) => {
    router.push(`/room/${room.roomId}`)
  }

  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4 min-h-[calc(100vh-3.5rem)]">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-4xl font-bold tracking-tight">Scrum Poker</CardTitle>
            <CardDescription className="text-base">Estimate story points with your team in real-time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={createRoom} disabled={isCreating} className="w-full h-12 text-base font-medium" size="lg">
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Room...
                </>
              ) : (
                "Create New Room"
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Create a room and share the link with your team to start voting
            </p>
          </CardContent>
        </Card>

        {roomHistory.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Rooms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {roomHistory.map((room) => (
                  <button
                    key={room.roomId}
                    onClick={() => handleRoomClick(room)}
                    className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {room.isAdmin ? (
                          <Crown className="h-5 w-5 text-primary" />
                        ) : (
                          <span className="text-sm font-semibold text-primary">
                            {room.participantName?.charAt(0).toUpperCase() || "?"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm truncate">{room.roomName || room.roomId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(room.lastJoined).toLocaleDateString()} at{" "}
                          {new Date(room.lastJoined).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {room.isAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteRoom(room.roomId, e)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
