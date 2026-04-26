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
use App\Http\Controllers\ExtensionRequestController;
use App\Http\Controllers\SupportTicketController;
use Illuminate\Support\Facades\Route;

// ── Public ──────────────────────────────────────────────────
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

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
    Route::get('/messages/contacts', [MessageController::class, 'contacts']);
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::post('/messages/conversations', [MessageController::class, 'startConversation']);
    Route::get('/messages/{conversationId}', [MessageController::class, 'show']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::post('/ai/chat', [AiChatbotController::class, 'chat']);
    Route::get('/categories', [ThesisController::class, 'categories']);
    Route::post('/support-tickets', [SupportTicketController::class, 'store']);
    Route::post('/extension-requests', [ExtensionRequestController::class, 'store']);

    // Thesis (shared for all roles)
    Route::apiResource('thesis', ThesisController::class);
    Route::post('/thesis/{id}/submit', [ThesisController::class, 'submit']);
    Route::get('/thesis/{id}/manuscript', [ThesisController::class, 'manuscript']);

    // ── VPAA ───────────────────────────────────────────────
    Route::middleware('role:vpaa')->prefix('vpaa')->group(function () {
        Route::get('/dashboard', [VpaaController::class, 'dashboard']);
        Route::get('/profile', [VpaaController::class, 'profile']);
        Route::put('/profile', [VpaaController::class, 'updateProfile']);
        Route::get('/categories', [VpaaController::class, 'categories']);
        Route::get('/activity-log', [VpaaController::class, 'activityLog']);
        Route::get('/daily-quote', [VpaaController::class, 'dailyQuote']);
        Route::apiResource('faculty', FacultyController::class);
        Route::patch('/faculty/{id}/status', [FacultyController::class, 'updateStatus']);
        Route::get('/faculty/export', [FacultyController::class, 'export']);
    });

    // ── Faculty ────────────────────────────────────────────
    Route::middleware('role:faculty')->prefix('faculty')->group(function () {
        Route::get('/dashboard', [FacultyController::class, 'dashboard']);
        Route::get('/profile', [FacultyController::class, 'profile']);
        Route::get('/activity-log', [FacultyController::class, 'activityLog']);
        Route::get('/advisees', [FacultyController::class, 'advisees']);
        Route::get('/advisers', [StudentController::class, 'advisers']);
        Route::get('/library-items', [FacultyController::class, 'libraryIndex']);
        Route::get('/library-items/{id}', [FacultyController::class, 'libraryShow']);
        Route::post('/library-items', [FacultyController::class, 'storeLibraryItem']);
        Route::patch('/library-items/{id}', [FacultyController::class, 'updateLibraryItem']);
        Route::delete('/library-items/{id}', [FacultyController::class, 'destroyLibraryItem']);
        Route::get('/share-users', [FacultyController::class, 'searchableShareUsers']);
        Route::get('/my-theses', [FacultyController::class, 'myTheses']);
        Route::post('/theses', [FacultyController::class, 'storeManagedThesis']);
        Route::post('/theses/{id}', [FacultyController::class, 'updateManagedThesis']);
        Route::patch('/theses/{id}', [FacultyController::class, 'updateManagedThesis']);
        Route::patch('/theses/{id}/archive', [FacultyController::class, 'archiveManagedThesis']);
        Route::delete('/theses/{id}', [FacultyController::class, 'destroyManagedThesis']);
        Route::apiResource('students', StudentController::class);
        Route::get('/thesis-submissions', [ThesisController::class, 'pendingReview']);
        Route::patch('/thesis/{id}/review', [ThesisController::class, 'review']);
        Route::get('/approved-thesis', [ThesisController::class, 'approved']);
        Route::patch('/approved-thesis/{id}/archive', [ThesisController::class, 'archiveApproved']);
        Route::get('/extension-requests', [ExtensionRequestController::class, 'indexForFaculty']);
    });

    // ── Student ────────────────────────────────────────────
    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/dashboard', [StudentController::class, 'dashboard']);
        Route::get('/profile', [StudentController::class, 'profile']);
        Route::get('/advisers', [StudentController::class, 'advisers']);
        Route::get('/my-submissions', [ThesisController::class, 'mySubmissions']);
        Route::get('/recently-viewed', [ThesisController::class, 'recentlyViewed']);
    });
});
