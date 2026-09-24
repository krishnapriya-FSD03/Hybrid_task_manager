from django.conf import settings
from django.core.mail import send_mail
from .models import Notification


def notify_user(user, event, message, related_object=None, send_email=True):
    """
    Central helper for creating an in-app notification (bell icon / toast)
    and, optionally, firing off an async email via Celery.

    Any view/service in the project should call this instead of writing
    to the Notification model directly, so behaviour stays consistent.
    """
    notification = Notification.objects.create(
        recipient=user,
        event=event,
        message=message,
        related_object=related_object,
    )

    if send_email and user.email_notifications_enabled and user.email:
        from .tasks import send_notification_email
        try:
            # Fire-and-forget: queue the email via Celery/Redis.
            send_notification_email.delay(notification.id)
        except Exception:
            # Broker (Redis) unreachable — don't let email delivery block
            # the in-app notification / API request. Falls back to
            # synchronous send so the user still gets notified.
            send_notification_email(notification.id)

    return notification
