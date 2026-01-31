"""
Authentication API Routes

Endpoints for user registration, login, and profile management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.dependencies import CurrentUser
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    AuthResponse,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    register_user,
    authenticate_user,
    create_user_token,
    format_user_response,
)


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Register a new HR or Candidate user account."
)
async def register(request: UserRegisterRequest):
    """
    Register a new user.
    
    - **email**: Unique email address
    - **password**: Minimum 8 characters
    - **full_name**: User's full name
    - **role**: 'hr' or 'candidate'
    """
    try:
        user = await register_user(request)
        token = create_user_token(str(user["_id"]))
        
        return AuthResponse(
            access_token=token,
            token_type="bearer",
            user=format_user_response(user)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="User login",
    description="Authenticate and receive JWT token."
)
async def login(request: UserLoginRequest):
    """
    Authenticate a user.
    
    Returns JWT access token and user profile on success.
    """
    user = await authenticate_user(request.email, request.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_user_token(str(user["_id"]))
    
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_response(user)
    )


@router.post(
    "/login/form",
    response_model=TokenResponse,
    summary="OAuth2 form login",
    description="Login using OAuth2 password form (for Swagger UI)."
)
async def login_form(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    OAuth2 compatible login endpoint.
    
    Used by Swagger UI for authentication.
    """
    user = await authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_user_token(str(user["_id"]))
    
    return TokenResponse(access_token=token)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Get the authenticated user's profile."
)
async def get_current_user_profile(current_user: CurrentUser):
    """
    Get current user's profile.
    
    Requires authentication.
    """
    return format_user_response(current_user)
