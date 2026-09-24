from rest_framework import serializers
from accounts.serializers import UserPublicSerializer
from .models import Task, Category, Tag, Comment, Attachment, ActivityLog


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "color"]


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name"]


class CommentSerializer(serializers.ModelSerializer):
    author = UserPublicSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "task", "author", "body", "created_at"]
        read_only_fields = ["author", "task"]


class AttachmentSerializer(serializers.ModelSerializer):
    uploaded_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = Attachment
        fields = ["id", "task", "file", "original_name", "uploaded_by", "uploaded_at"]
        read_only_fields = ["uploaded_by", "task"]


class ActivityLogSerializer(serializers.ModelSerializer):
    actor = UserPublicSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = ["id", "action", "actor", "created_at"]


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for board / list views."""

    assignee = UserPublicSerializer(read_only=True)
    owner = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    comment_count = serializers.IntegerField(source="comments.count", read_only=True)

    class Meta:
        model = Task
        fields = [
            "id", "mode", "title", "priority", "status", "due_date", "reminder_at",
            "owner", "assignee", "category", "tags", "team", "board",
            "recurrence_frequency", "comment_count", "created_at", "updated_at",
        ]


class TaskDetailSerializer(serializers.ModelSerializer):
    assignee = UserPublicSerializer(read_only=True)
    owner = UserPublicSerializer(read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    watchers = UserPublicSerializer(many=True, read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    logs = ActivityLogSerializer(many=True, read_only=True)

    tag_names = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", queryset=Category.objects.all(), write_only=True, required=False, allow_null=True
    )
    assignee_username = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Task
        fields = [
            "id", "mode", "title", "description", "priority", "status",
            "tags", "tag_names", "due_date", "reminder_at",
            "recurrence_frequency", "recurrence_end_date",
            "owner", "category", "category_id",
            "team", "board", "assignee", "assignee_username", "created_by", "watchers",
            "comments", "attachments", "logs", "created_at", "updated_at", "completed_at",
        ]
        read_only_fields = ["owner", "created_by", "assignee"]

    def create(self, validated_data):
        tag_names = validated_data.pop("tag_names", [])
        assignee_username = validated_data.pop("assignee_username", None)
        task = Task.objects.create(**validated_data)
        self._apply_tags(task, tag_names)
        if assignee_username:
            self._apply_assignee(task, assignee_username)
        return task

    def update(self, instance, validated_data):
        tag_names = validated_data.pop("tag_names", None)
        assignee_username = validated_data.pop("assignee_username", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if tag_names is not None:
            self._apply_tags(instance, tag_names)
        if assignee_username is not None:
            self._apply_assignee(instance, assignee_username)
        return instance

    def _apply_tags(self, task, tag_names):
        tags = []
        for name in tag_names:
            tag, _ = Tag.objects.get_or_create(name=name.strip().lower())
            tags.append(tag)
        task.tags.set(tags)

    def _apply_assignee(self, task, username):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not username:
            task.assignee = None
        else:
            try:
                task.assignee = User.objects.get(username__iexact=username)
            except User.DoesNotExist:
                raise serializers.ValidationError({"assignee_username": "No such user."})
        task.save(update_fields=["assignee"])
