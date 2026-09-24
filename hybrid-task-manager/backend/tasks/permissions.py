from rest_framework import permissions
from .models import Task
from teams.models import TeamMembership


class IsTaskParticipant(permissions.BasePermission):
    """
    Personal tasks: only the owner may access, edit, or delete.
    Professional tasks: any team member may view; deleting is restricted
    to the task's creator, its assignee, or a team Manager/Team Lead —
    this stops any random team member from deleting someone else's task.
    """

    def has_object_permission(self, request, view, obj: Task):
        if obj.mode == Task.Mode.PERSONAL:
            return obj.owner_id == request.user.id

        if not obj.team_id:
            return False
        is_member = obj.team.memberships.filter(user=request.user).exists()
        if not is_member:
            return False

        if request.method == "DELETE":
            if obj.created_by_id == request.user.id or obj.assignee_id == request.user.id:
                return True
            membership = obj.team.memberships.filter(user=request.user).first()
            return bool(membership and membership.role in (
                TeamMembership.Role.MANAGER, TeamMembership.Role.TEAM_LEAD
            ))

        return True
