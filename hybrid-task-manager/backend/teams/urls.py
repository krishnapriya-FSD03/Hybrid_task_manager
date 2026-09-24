from rest_framework.routers import DefaultRouter
from .views import TeamViewSet, ProjectBoardViewSet

router = DefaultRouter()
router.register("teams", TeamViewSet, basename="team")
router.register("boards", ProjectBoardViewSet, basename="board")

urlpatterns = router.urls
