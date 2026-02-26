from rest_framework.pagination import PageNumberPagination


class DefaultPageNumberPagination(PageNumberPagination):
    """
    Enable client-driven `page_size` while keeping a sane upper bound.
    """

    page_size_query_param = "page_size"
    max_page_size = 100

