from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Extends Django's built-in user with an account type.

    - personal:     can only use the personal task manager
    - professional: can use personal AND professional (team) modes.
                     The two modes are fully independent for this user.
    """

    class AccountType(models.TextChoices):
        PERSONAL = "personal", "Personal"
        PROFESSIONAL = "professional", "Professional"

    account_type = models.CharField(
        max_length=20, choices=AccountType.choices, default=AccountType.PERSONAL
    )
    email = models.EmailField(unique=True)
    avatar_url = models.URLField(blank=True, null=True)
    email_notifications_enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    @property
    def is_professional(self):
        return self.account_type == self.AccountType.PROFESSIONAL

    def __str__(self):
        return self.username
