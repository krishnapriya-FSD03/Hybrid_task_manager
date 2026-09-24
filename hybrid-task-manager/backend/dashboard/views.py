from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

from tasks.models import Task


class PersonalDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Task.objects.filter(mode=Task.Mode.PERSONAL, owner=request.user)
        return Response(_build_stats(qs))


class ProfessionalDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        team_id = request.query_params.get("team")
        qs = Task.objects.filter(mode=Task.Mode.PROFESSIONAL, team__memberships__user=request.user)
        if team_id:
            qs = qs.filter(team_id=team_id)

        stats = _build_stats(qs)
        stats["by_assignee"] = list(
            qs.exclude(assignee__isnull=True)
            .values("assignee__username")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        return Response(stats)


def _build_stats(qs):
    now = timezone.now()
    by_status = {row["status"]: row["count"] for row in qs.values("status").annotate(count=Count("id"))}
    by_priority = {row["priority"]: row["count"] for row in qs.values("priority").annotate(count=Count("id"))}

    completed = qs.filter(status=Task.Status.DONE)
    overdue = qs.exclude(status=Task.Status.DONE).filter(due_date__lt=now)
    upcoming = qs.exclude(status=Task.Status.DONE).filter(
        due_date__gte=now, due_date__lte=now + timedelta(days=7)
    )

    calendar = list(
        qs.exclude(due_date__isnull=True)
        .values("id", "title", "due_date", "status", "priority")
        .order_by("due_date")[:200]
    )

    return {
        "total": qs.count(),
        "completed": completed.count(),
        "overdue": overdue.count(),
        "upcoming_7_days": upcoming.count(),
        "by_status": by_status,
        "by_priority": by_priority,
        "calendar": calendar,
    }
