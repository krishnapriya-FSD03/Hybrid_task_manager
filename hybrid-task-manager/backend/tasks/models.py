from django.conf import settings
from django.db import models
from teams.models import ProjectBoard, Team


class Category(models.Model):
    """User-defined categories for personal tasks (e.g. Health, Finance, Work)."""

    name = models.CharField(max_length=80)
    color = models.CharField(max_length=7, default="#6366F1")
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="categories")

    class Meta:
        unique_together = ("name", "owner")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Task(models.Model):
    class Mode(models.TextChoices):
        PERSONAL = "personal", "Personal"
        PROFESSIONAL = "professional", "Professional"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Status(models.TextChoices):
        TODO = "todo", "To Do"
        IN_PROGRESS = "in_progress", "In Progress"
        IN_REVIEW = "in_review", "In Review"
        DONE = "done", "Done"

    class RecurrenceFrequency(models.TextChoices):
        NONE = "none", "None"
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    mode = models.CharField(max_length=20, choices=Mode.choices)

    # Common fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.TODO)
    tags = models.ManyToManyField(Tag, blank=True, related_name="tasks")
    due_date = models.DateTimeField(null=True, blank=True)
    reminder_at = models.DateTimeField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)

    # Recurrence
    recurrence_frequency = models.CharField(
        max_length=10, choices=RecurrenceFrequency.choices, default=RecurrenceFrequency.NONE
    )
    recurrence_end_date = models.DateField(null=True, blank=True)
    parent_recurring_task = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="instances"
    )

    # Personal-mode fields
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="personal_tasks",
        null=True, blank=True,
    )
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="tasks")

    # Professional-mode fields
    team = models.ForeignKey(Team, null=True, blank=True, on_delete=models.CASCADE, related_name="tasks")
    board = models.ForeignKey(ProjectBoard, null=True, blank=True, on_delete=models.CASCADE, related_name="tasks")
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="assigned_tasks"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_tasks"
    )
    watchers = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True, related_name="watched_tasks")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["mode", "owner"]),
            models.Index(fields=["mode", "team", "board"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return self.title

    @property
    def is_recurring(self):
        return self.recurrence_frequency != self.RecurrenceFrequency.NONE


class Comment(models.Model):
    task = models.ForeignKey(Task, related_name="comments", on_delete=models.CASCADE)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]


class Attachment(models.Model):
    task = models.ForeignKey(Task, related_name="attachments", on_delete=models.CASCADE)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to="attachments/%Y/%m/")
    original_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ActivityLog(models.Model):
    """Audit trail: assignment changes, status updates, comments, etc."""

    task = models.ForeignKey(Task, related_name="logs", on_delete=models.CASCADE)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
