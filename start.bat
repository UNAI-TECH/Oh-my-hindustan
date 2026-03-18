@echo off
echo ============================================
echo   Oh My Hindustan - Starting All Services
echo ============================================
echo.
echo Starting PostgreSQL, Redis, and Backend...
echo.
docker compose up --build
