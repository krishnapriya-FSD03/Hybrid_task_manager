from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Task, Category, Comment, Attachment, ActivityLog
from .serializers import (
    TaskListSerializer, TaskDetailSerializer, CategorySerializer,
    CommentSerializer, AttachmentSerializer,
)
from .permissions import IsTaskParticipant
from notifications.utils import notify_user


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class TaskViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsTaskParticipant]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["mode", "status", "priority", "team", "board", "assignee", "category"]
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "created_at", "priority", "updated_at"]

    def get_serializer_class(self):
        return TaskDetailSerializer if self.action in ("retrieve", "create", "update", "partial_update") else TaskListSerializer

    def get_queryset(self):
        user = self.request.user
        mode = self.request.query_params.get("mode")
        qs = Task.objects.select_related("owner", "assignee", "category", "team", "board")

        if mode == Task.Mode.PERSONAL:
            return qs.filter(mode=Task.Mode.PERSONAL, owner=user)
        if mode == Task.Mode.PROFESSIONAL:
            return qs.filter(mode=Task.Mode.PROFESSIONAL, team__memberships__user=user).distinct()

        # default: everything the user can see across both modes
        return qs.filter(
            Q(mode=Task.Mode.PERSONAL, owner=user) |
            Q(mode=Task.Mode.PROFESSIONAL, team__memberships__user=user)
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user
        mode = serializer.validated_data.get("mode", Task.Mode.PERSONAL)
        if mode == Task.Mode.PERSONAL:
            task = serializer.save(owner=user, created_by=user)
        else:
            team = serializer.validated_data.get("team")
            if not team or not team.memberships.filter(user=user).exists():
                raise permissions.PermissionDenied("You must be a team member to create a professional task.")
            task = serializer.save(created_by=user)
            if task.assignee:
                self._log(task, user, f"Task assigned to {task.assignee.username}")
                notify_user(
                    task.assignee, event="task_assigned",
                    message=f"You were assigned: {task.title}", related_object=task,
                )
        self._log(task, user, "Task created")

    def perform_update(self, serializer):
        user = self.request.user
        old = self.get_object()
        old_status, old_assignee = old.status, old.assignee_id
        task = serializer.save()

        if task.status != old_status:
            self._log(task, user, f"Status changed: {old_status} → {task.status}")
            for watcher in list(task.watchers.all()) + ([task.assignee] if task.assignee else []):
                if watcher and watcher != user:
                    notify_user(
                        watcher, event="status_update",
                        message=f"'{task.title}' status changed to {task.get_status_display()}",
                        related_object=task,
                    )

        if task.assignee_id != old_assignee and task.assignee:
            self._log(task, user, f"Task assigned to {task.assignee.username}")
            notify_user(
                task.assignee, event="task_assigned",
                message=f"You were assigned: {task.title}", related_object=task,
            )

    @staticmethod
    def _log(task, actor, action_text):
        ActivityLog.objects.create(task=task, actor=actor, action=action_text)

    @action(detail=True, methods=["post"])
    def add_comment(self, request, pk=None):
        task = self.get_object()
        body = request.data.get("body", "").strip()
        if not body:
            return Response({"detail": "Comment body required."}, status=400)
        comment = Comment.objects.create(task=task, author=request.user, body=body)
        self._log(task, request.user, "Comment added")

        recipients = set(task.watchers.all())
        if task.assignee:
            recipients.add(task.assignee)
        if task.mode == Task.Mode.PERSONAL and task.owner:
            recipients.add(task.owner)
        recipients.discard(request.user)
        for r in recipients:
            notify_user(r, event="comment_added", message=f"New comment on '{task.title}'", related_object=task)

        return Response(CommentSerializer(comment).data, status=201)

    @action(detail=True, methods=["post"])
    def toggle_watch(self, request, pk=None):
        task = self.get_object()
        if task.watchers.filter(id=request.user.id).exists():
            task.watchers.remove(request.user)
            watching = False
        else:
            task.watchers.add(request.user)
            watching = True
        return Response({"watching": watching})

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def upload_attachment(self, request, pk=None):
        task = self.get_object()
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file provided."}, status=400)
        attachment = Attachment.objects.create(
            task=task, uploaded_by=request.user, file=file_obj, original_name=file_obj.name
        )
        self._log(task, request.user, f"Attachment added: {file_obj.name}")
        return Response(AttachmentSerializer(attachment).data, status=201)
