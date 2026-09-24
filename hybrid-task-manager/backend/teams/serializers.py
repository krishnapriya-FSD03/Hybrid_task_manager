from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import Team, TeamMembership, ProjectBoard


class TeamMembershipSerializer(serializers.ModelSerializer):
    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = TeamMembership
        fields = ["id", "user", "role", "joined_at"]


class TeamSerializer(serializers.ModelSerializer):
    memberships = TeamMembershipSerializer(many=True, read_only=True)
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = ["id", "name", "description", "created_by", "memberships", "my_role", "created_at"]
        read_only_fields = ["created_by"]

    def get_my_role(self, obj):
        request = self.context.get("request")
        if not request:
            return None
        m = obj.memberships.filter(user=request.user).first()
        return m.role if m else None


class AddTeamMemberSerializer(serializers.Serializer):
    username = serializers.CharField()
    role = serializers.ChoiceField(choices=TeamMembership.Role.choices, default=TeamMembership.Role.TEAM_MEMBER)


class ProjectBoardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectBoard
        fields = ["id", "team", "name", "description", "created_by", "created_at"]
        read_only_fields = ["created_by"]
