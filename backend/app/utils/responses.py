"""
Response Utilities Module

Standardized API response helpers for consistent formatting.
"""

from typing import Any, Optional

from fastapi import status
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = status.HTTP_200_OK
) -> JSONResponse:
    """
    Create a standardized success response.
    
    Args:
        data: Response payload
        message: Success message
        status_code: HTTP status code
        
    Returns:
        JSONResponse with consistent structure
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "success": True,
            "message": message,
            "data": data
        }
    )


def error_response(
    message: str = "An error occurred",
    status_code: int = status.HTTP_400_BAD_REQUEST,
    errors: Optional[list] = None
) -> JSONResponse:
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        status_code: HTTP status code
        errors: Optional list of detailed errors
        
    Returns:
        JSONResponse with consistent error structure
    """
    content = {
        "success": False,
        "message": message,
    }
    
    if errors:
        content["errors"] = errors
    
    return JSONResponse(
        status_code=status_code,
        content=content
    )


def pagination_response(
    data: list,
    total: int,
    page: int,
    page_size: int,
    message: str = "Success"
) -> dict:
    """
    Create a standardized paginated response structure.
    
    Args:
        data: List of items for current page
        total: Total number of items
        page: Current page number (1-indexed)
        page_size: Number of items per page
        message: Success message
        
    Returns:
        Dictionary with pagination metadata
    """
    total_pages = (total + page_size - 1) // page_size
    
    return {
        "success": True,
        "message": message,
        "data": data,
        "pagination": {
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }
    }
