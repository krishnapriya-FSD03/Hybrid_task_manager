from rest_framework import permissions
from .models import TeamMembership


class IsTeamManagerOrLead(permissions.BasePermission):
    """Only Managers/Team Leads can manage membership, boards, and assignments."""

    def has_object_permission(self, request, view, obj):
        team = obj if hasattr(obj, "memberships") else obj.team
        membership = team.memberships.filter(user=request.user).first()
        if not membership:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return membership.role in (TeamMembership.Role.MANAGER, TeamMembership.Role.TEAM_LEAD)


class IsTeamManager(permissions.BasePermission):
    """Reserved for the most destructive actions (deleting a team) — Manager only."""

    def has_object_permission(self, request, view, obj):
        team = obj if hasattr(obj, "memberships") else obj.team
        membership = team.memberships.filter(user=request.user).first()
        if request.method in permissions.SAFE_METHODS:
            return bool(membership)
        return bool(membership and membership.role == TeamMembership.Role.MANAGER)


class IsTeamMember(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        team = obj if hasattr(obj, "memberships") else obj.team
        return team.memberships.filter(user=request.user).exists()
