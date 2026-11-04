import django_filters
from django.utils import timezone
from .models import lead_management


class LeadFilter(django_filters.FilterSet):
    # Follow-up date range
    followup_date_from = django_filters.DateFilter(field_name="followup_date", lookup_expr="gte")
    followup_date_to   = django_filters.DateFilter(field_name="followup_date", lookup_expr="lte")

    # Lead date range
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to   = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    # Overdue follow-ups
    overdue = django_filters.BooleanFilter(method="filter_overdue")

    # Today's follow-ups
    followup_today = django_filters.BooleanFilter(method="filter_followup_today")

    def filter_overdue(self, queryset, name, value):
        if value:
            today = timezone.localdate()
            return queryset.filter(
                followup_date__lt=today,
                followup_date__isnull=False
            ).exclude(status__in=["closed", "close_win", "closed_win", "close_loss", "closed_loss"])
        return queryset

    def filter_followup_today(self, queryset, name, value):
        if value:
            today = timezone.localdate()
            return queryset.filter(followup_date=today)
        return queryset

    class Meta:
        model = lead_management
        fields = [
            "assign_to",
            "status",
            "followup_date_from",
            "followup_date_to",
            "date_from",
            "date_to",
            "overdue",
            "followup_today",
        ]
