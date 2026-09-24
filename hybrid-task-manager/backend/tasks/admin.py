from django.contrib import admin
from .models import Task, Category, Tag, Comment, Attachment, ActivityLog

admin.site.register(Task)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(Comment)
admin.site.register(Attachment)
admin.site.register(ActivityLog)
