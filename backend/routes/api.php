<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\AblyTokenController;
use App\Http\Controllers\VpaaController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\ThesisController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\AiChatbotController;
use Illuminate\Support\Facades\Route;

// ── Public ──────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);

// ── Authenticated ────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Ably token endpoint (frontend requests this after login)
    Route::get('/ably/token', [AblyTokenController::class, 'issue']);

    // Shared
    Route::get('/search', [SearchController::class, 'search']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::get('/messages/{conversationId}', [MessageController::class, 'show']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::post('/ai/chat', [AiChatbotController::class, 'chat']);

    // Thesis (shared for all roles)
    Route::apiResource('thesis', ThesisController::class)->except(['destroy']);
    Route::post('/thesis/{id}/submit', [ThesisController::class, 'submit']);

    // ── VPAA ───────────────────────────────────────────────
    Route::middleware('role:vpaa')->prefix('vpaa')->group(function () {
        Route::get('/dashboard', [VpaaController::class, 'dashboard']);
        Route::get('/activity-log', [VpaaController::class, 'activityLog']);
        Route::apiResource('faculty', FacultyController::class);
        Route::patch('/faculty/{id}/status', [FacultyController::class, 'updateStatus']);
        Route::get('/faculty/export', [FacultyController::class, 'export']);
    });

    // ── Faculty ────────────────────────────────────────────
    Route::middleware('role:faculty')->prefix('faculty')->group(function () {
        Route::get('/dashboard', [FacultyController::class, 'dashboard']);
        Route::apiResource('students', StudentController::class);
        Route::get('/thesis-submissions', [ThesisController::class, 'pendingReview']);
        Route::patch('/thesis/{id}/review', [ThesisController::class, 'review']);
        Route::get('/approved-thesis', [ThesisController::class, 'approved']);
    });

    // ── Student ────────────────────────────────────────────
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/dashboard', [StudentController::class, 'dashboard']);
        Route::get('/my-submissions', [ThesisController::class, 'mySubmissions']);
        Route::get('/recently-viewed', [ThesisController::class, 'recentlyViewed']);
    });
});
