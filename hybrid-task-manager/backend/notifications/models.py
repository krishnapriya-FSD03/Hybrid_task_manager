from django.conf import settings
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Notification(models.Model):
    class Event(models.TextChoices):
        TASK_ASSIGNED = "task_assigned", "Task assigned"
        COMMENT_ADDED = "comment_added", "Comment added"
        STATUS_UPDATE = "status_update", "Status updated"
        REMINDER = "reminder", "Reminder"
        TEAM_INVITE = "team_invite", "Team invite"
        WATCHER_UPDATE = "watcher_update", "Watched task updated"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, related_name="notifications", on_delete=models.CASCADE
    )
    event = models.CharField(max_length=30, choices=Event.choices)
    message = models.CharField(max_length=500)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    # Generic relation so a notification can point at a Task, Team, Comment, etc.
    content_type = models.ForeignKey(ContentType, null=True, blank=True, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    related_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read"])]

    def __str__(self):
        return f"{self.event} -> {self.recipient.username}"
