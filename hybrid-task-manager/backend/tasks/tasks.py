from datetime import timedelta
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from celery import shared_task

from .models import Task


@shared_task
def check_due_reminders():
    """Runs every minute (see CELERY_BEAT_SCHEDULE). Fires notifications
    for any task whose reminder_at has passed and hasn't been sent yet."""
    from notifications.utils import notify_user

    now = timezone.now()
    due = Task.objects.filter(reminder_at__lte=now, reminder_sent=False).exclude(status=Task.Status.DONE)
    for task in due:
        recipients = set()
        if task.mode == Task.Mode.PERSONAL and task.owner:
            recipients.add(task.owner)
        else:
            if task.assignee:
                recipients.add(task.assignee)
            recipients |= set(task.watchers.all())
        for user in recipients:
            notify_user(user, event="reminder", message=f"Reminder: '{task.title}' is due soon", related_object=task)
        task.reminder_sent = True
        task.save(update_fields=["reminder_sent"])


@shared_task
def generate_recurring_instances():
    """Runs every 5 minutes. For each recurring parent task whose latest
    instance is complete/overdue, spins up the next occurrence."""
    now = timezone.now()
    parents = Task.objects.exclude(recurrence_frequency=Task.RecurrenceFrequency.NONE).filter(
        parent_recurring_task__isnull=True
    )
    step_map = {
        Task.RecurrenceFrequency.DAILY: relativedelta(days=1),
        Task.RecurrenceFrequency.WEEKLY: relativedelta(weeks=1),
        Task.RecurrenceFrequency.MONTHLY: relativedelta(months=1),
        Task.RecurrenceFrequency.YEARLY: relativedelta(years=1),
    }

    for parent in parents:
        if parent.recurrence_end_date and now.date() > parent.recurrence_end_date:
            continue
        latest = parent.instances.order_by("-due_date").first() or parent
        if not latest.due_date:
            continue
        if latest.status != Task.Status.DONE or latest.due_date > now:
            continue

        step = step_map.get(parent.recurrence_frequency)
        if not step:
            continue
        next_due = latest.due_date + step

        Task.objects.create(
            mode=parent.mode, title=parent.title, description=parent.description,
            priority=parent.priority, status=Task.Status.TODO,
            due_date=next_due, reminder_at=(next_due - timedelta(hours=1)) if parent.reminder_at else None,
            recurrence_frequency=Task.RecurrenceFrequency.NONE,
            owner=parent.owner, category=parent.category,
            team=parent.team, board=parent.board, assignee=parent.assignee,
            created_by=parent.created_by, parent_recurring_task=parent,
        )
