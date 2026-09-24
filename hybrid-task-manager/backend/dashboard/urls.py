from django.urls import path
from .views import PersonalDashboardView, ProfessionalDashboardView

urlpatterns = [
    path("personal/", PersonalDashboardView.as_view(), name="dashboard-personal"),
    path("professional/", ProfessionalDashboardView.as_view(), name="dashboard-professional"),
]
