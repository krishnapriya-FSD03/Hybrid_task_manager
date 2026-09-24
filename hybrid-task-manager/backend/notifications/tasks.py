from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(ignore_result=True)
def send_notification_email(notification_id):
    from .models import Notification
    try:
        n = Notification.objects.select_related("recipient").get(id=notification_id)
    except Notification.DoesNotExist:
        return
    send_mail(
        subject=f"[Hybrid Task Manager] {n.get_event_display()}",
        message=n.message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[n.recipient.email],
        fail_silently=True,
    )
