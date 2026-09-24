from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    related_type = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "event", "message", "is_read", "created_at", "object_id", "related_type"]

    def get_related_type(self, obj):
        return obj.content_type.model if obj.content_type else None
