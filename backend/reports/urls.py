from django.urls import path
from reports.views import SummaryReportView, ByCategoryReportView, ForecastReportView

urlpatterns = [
    path("summary/", SummaryReportView.as_view(), name="report-summary"),
    path("by-category/", ByCategoryReportView.as_view(), name="report-by-category"),
    path("forecast/", ForecastReportView.as_view(), name="report-forecast"),
]
