'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { toast } from 'sonner'
import axios from 'axios'

interface Member {
  id: string
  email: string
  role: string
}

interface WorkspaceManagementProps {
  workspaceId: string
  members: Member[]
  currentUserRole: string
}

export function WorkspaceManagement({
  workspaceId,
  members,
  currentUserRole,
}: WorkspaceManagementProps) {
  const router = useRouter()
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)

  const handleInvite = async () => {
    if (!inviteEmail) return

    try {
      setIsInviting(true)
      await axios.post(`/api/workspaces/${workspaceId}/invite`, {
        email: inviteEmail,
      })
      toast.success('Invitation sent successfully')
      setInviteEmail('')
      router.refresh()
    } catch (error) {
      console.error('Failed to send invitation:', error)
      toast.error('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await axios.delete(`/api/workspaces/${workspaceId}/members/${memberId}`)
      toast.success('Member removed successfully')
      router.refresh()
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error('Failed to remove member')
    }
  }

  const canManageMembers = ['SUPER_ADMIN', 'ADMIN'].includes(currentUserRole)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Team Members</h2>
        {canManageMembers && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Invite Member</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Enter email address"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail}
                  className="w-full"
                >
                  {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            {canManageMembers && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>{member.email}</TableCell>
              <TableCell className="capitalize">{member.role.toLowerCase()}</TableCell>
              {canManageMembers && (
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    disabled={member.role === 'SUPER_ADMIN'}
                  >
                    Remove
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 