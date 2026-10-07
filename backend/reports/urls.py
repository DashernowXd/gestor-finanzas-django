from django.urls import path
from reports.views import SummaryReportView, ByCategoryReportView

urlpatterns = [
    path("summary/", SummaryReportView.as_view(), name="report-summary"),
    path("by-category/", ByCategoryReportView.as_view(), name="report-by-category"),
]
