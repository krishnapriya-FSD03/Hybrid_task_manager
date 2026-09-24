from django.contrib.auth import get_user_model
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Team, TeamMembership, ProjectBoard
from .serializers import TeamSerializer, AddTeamMemberSerializer, ProjectBoardSerializer
from .permissions import IsTeamManagerOrLead, IsTeamManager
from notifications.utils import notify_user

User = get_user_model()


class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer

    def get_permissions(self):
        # Manager or Team Lead may rename/redescribe the team; only a
        # Manager may delete it outright — deletion is the one action
        # that can't be undone or reassigned, so it gets the tighter rule.
        if self.action in ("update", "partial_update"):
            return [permissions.IsAuthenticated(), IsTeamManagerOrLead()]
        if self.action == "destroy":
            return [permissions.IsAuthenticated(), IsTeamManager()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return Team.objects.filter(memberships__user=self.request.user).distinct()

    def perform_create(self, serializer):
        team = serializer.save(created_by=self.request.user)
        TeamMembership.objects.create(
            team=team, user=self.request.user, role=TeamMembership.Role.MANAGER
        )

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        team = self.get_object()
        membership = team.memberships.filter(user=request.user).first()
        if not membership or membership.role not in (
            TeamMembership.Role.MANAGER, TeamMembership.Role.TEAM_LEAD
        ):
            return Response({"detail": "Not permitted."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AddTeamMemberSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            target = User.objects.get(username__iexact=serializer.validated_data["username"])
        except User.DoesNotExist:
            return Response({"detail": "No user with that username."}, status=404)

        member, created = TeamMembership.objects.get_or_create(
            team=team, user=target,
            defaults={"role": serializer.validated_data["role"]},
        )
        if not created:
            return Response({"detail": "User already on team."}, status=400)

        notify_user(
            target, event="team_invite",
            message=f"You were added to team '{team.name}'.",
            related_object=team,
        )
        return Response(TeamSerializer(team, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def remove_member(self, request, pk=None):
        team = self.get_object()
        membership = team.memberships.filter(user=request.user).first()
        if not membership or membership.role != TeamMembership.Role.MANAGER:
            return Response({"detail": "Only a Manager can remove members."}, status=403)
        username = request.data.get("username")
        TeamMembership.objects.filter(team=team, user__username=username).exclude(
            role=TeamMembership.Role.MANAGER
        ).delete()
        return Response(TeamSerializer(team, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def update_member_role(self, request, pk=None):
        """Change an existing member's role — Manager only, to prevent
        a Team Lead from promoting themself (or anyone else) to Manager."""
        team = self.get_object()
        membership = team.memberships.filter(user=request.user).first()
        if not membership or membership.role != TeamMembership.Role.MANAGER:
            return Response({"detail": "Only a Manager can change member roles."}, status=403)

        username = request.data.get("username")
        new_role = request.data.get("role")
        if new_role not in TeamMembership.Role.values:
            return Response({"detail": "Invalid role."}, status=400)

        target_membership = team.memberships.filter(user__username=username).first()
        if not target_membership:
            return Response({"detail": "User is not a member of this team."}, status=404)

        target_membership.role = new_role
        target_membership.save(update_fields=["role"])
        return Response(TeamSerializer(team, context={"request": request}).data)


class ProjectBoardViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectBoardSerializer

    def get_permissions(self):
        # Any team member can create/view boards; only Manager/Team Lead
        # can rename or delete one.
        if self.action in ("update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated(), IsTeamManagerOrLead()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        return ProjectBoard.objects.filter(team__memberships__user=self.request.user).distinct()

    def perform_create(self, serializer):
        team = serializer.validated_data["team"]
        if not team.memberships.filter(user=self.request.user).exists():
            raise permissions.PermissionDenied("Not a member of this team.")
        serializer.save(created_by=self.request.user)
