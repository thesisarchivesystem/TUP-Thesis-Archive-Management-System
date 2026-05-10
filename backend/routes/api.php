<?php

use App\Http\Controllers\AblyTokenController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AiChatbotController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\ExtensionRequestController;
use App\Http\Controllers\FacultyController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SupportTicketController;
use App\Http\Controllers\ThesisController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
Route::post('/ai/chat', [AiChatbotController::class, 'chat'])->middleware('throttle:20,1');

Route::middleware(['auth:sanctum', 'active.user'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/ably/token', [AblyTokenController::class, 'issue']);

    Route::get('/search', [SearchController::class, 'search']);
    Route::get('/search/filter-options', [SearchController::class, 'filterOptions']);
    Route::get('/search/suggestions', [SearchController::class, 'suggestions']);
    Route::post('/search/click', [SearchController::class, 'click']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/messages/contacts', [MessageController::class, 'contacts']);
    Route::get('/messages/conversations', [MessageController::class, 'conversations']);
    Route::post('/messages/conversations', [MessageController::class, 'startConversation']);
    Route::get('/messages/{conversationId}', [MessageController::class, 'show']);
    Route::post('/messages', [MessageController::class, 'store']);
    Route::get('/categories', [ThesisController::class, 'categories']);
    Route::post('/support-tickets', [SupportTicketController::class, 'store']);
    Route::post('/extension-requests', [ExtensionRequestController::class, 'store']);
    Route::get('/academic-structure', [AdminController::class, 'structure']);

    Route::apiResource('thesis', ThesisController::class);
    Route::post('/thesis/{id}/submit', [ThesisController::class, 'submit']);
    Route::get('/thesis/{id}/manuscript', [ThesisController::class, 'manuscript']);

    Route::middleware('role:faculty')->prefix('faculty')->group(function () {
        Route::get('/dashboard', [FacultyController::class, 'dashboard']);
        Route::get('/best-theses', [FacultyController::class, 'bestTheses']);
        Route::post('/best-theses', [FacultyController::class, 'appointBestThesis']);
        Route::get('/profile', [FacultyController::class, 'profile']);
        Route::patch('/profile', [FacultyController::class, 'updateProfile']);
        Route::get('/activity-log', [FacultyController::class, 'activityLog']);
        Route::get('/advisees', [FacultyController::class, 'advisees']);
        Route::get('/advisers', [StudentController::class, 'advisers']);
        Route::get('/library-items', [FacultyController::class, 'libraryIndex']);
        Route::get('/library-items/{id}', [FacultyController::class, 'libraryShow']);
        Route::post('/library-items', [FacultyController::class, 'storeLibraryItem']);
        Route::patch('/library-items/{id}', [FacultyController::class, 'updateLibraryItem']);
        Route::delete('/library-items/{id}', [FacultyController::class, 'destroyLibraryItem']);
        Route::get('/share-users', [FacultyController::class, 'searchableShareUsers']);
        Route::get('/my-theses', [ThesisController::class, 'mySubmissions']);
        Route::post('/theses', [FacultyController::class, 'storeManagedThesis']);
        Route::post('/theses/{id}', [FacultyController::class, 'updateManagedThesis']);
        Route::patch('/theses/{id}', [FacultyController::class, 'updateManagedThesis']);
        Route::patch('/theses/{id}/archive', [FacultyController::class, 'archiveManagedThesis']);
        Route::delete('/theses/{id}', [FacultyController::class, 'destroyManagedThesis']);
        Route::apiResource('students', StudentController::class);
        Route::get('/thesis-submissions', [ThesisController::class, 'pendingReview']);
        Route::get('/thesis-review-stats', [ThesisController::class, 'reviewStats']);
        Route::patch('/thesis/{id}/review', [ThesisController::class, 'review']);
        Route::get('/approved-thesis', [ThesisController::class, 'approved']);
        Route::patch('/approved-thesis/{id}/archive', [ThesisController::class, 'archiveApproved']);
        Route::delete('/approved-thesis/{id}', [ThesisController::class, 'destroyApproved']);
        Route::get('/extension-requests', [ExtensionRequestController::class, 'indexForFaculty']);
        Route::get('/extension-requests/{id}', [ExtensionRequestController::class, 'showForFaculty']);
        Route::patch('/extension-requests/{id}', [ExtensionRequestController::class, 'decide']);
    });

    Route::middleware('role:student')->prefix('student')->group(function () {
        Route::get('/dashboard', [StudentController::class, 'dashboard']);
        Route::get('/profile', [StudentController::class, 'profile']);
        Route::get('/advisers', [StudentController::class, 'advisers']);
        Route::get('/my-submissions', [ThesisController::class, 'mySubmissions']);
        Route::get('/recently-viewed', [ThesisController::class, 'recentlyViewed']);
        Route::get('/extension-requests/thesis/{thesisId}', [ExtensionRequestController::class, 'showForStudentByThesis']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/best-theses', [AdminController::class, 'bestTheses']);
        Route::post('/best-theses', [AdminController::class, 'appointBestThesis']);
        Route::delete('/best-theses/{schoolYear}', [AdminController::class, 'removeBestThesis']);
        Route::post('/theses', [AdminController::class, 'storeThesis']);
        Route::get('/theses/{id}', [AdminController::class, 'showThesis']);
        Route::post('/theses/{id}', [AdminController::class, 'updateThesis']);
        Route::patch('/theses/{id}', [AdminController::class, 'updateThesis']);
        Route::get('/support-tickets', [SupportTicketController::class, 'indexForAdmin']);
        Route::get('/support-tickets/{id}', [SupportTicketController::class, 'showForAdmin']);
        Route::patch('/support-tickets/{id}', [SupportTicketController::class, 'updateForAdmin']);
        Route::post('/support-tickets/{id}/replies', [SupportTicketController::class, 'replyForAdmin']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'storeUser']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::patch('/users/{id}/status', [AdminController::class, 'toggleUserStatus']);
        Route::get('/categories', [AdminController::class, 'categories']);
        Route::post('/categories', [AdminController::class, 'storeCategory']);
        Route::put('/categories/{id}', [AdminController::class, 'updateCategory']);
        Route::get('/structure', [AdminController::class, 'structure']);
        Route::post('/colleges', [AdminController::class, 'storeCollege']);
        Route::put('/colleges/{id}', [AdminController::class, 'updateCollege']);
        Route::post('/departments', [AdminController::class, 'storeDepartment']);
        Route::put('/departments/{id}', [AdminController::class, 'updateDepartment']);
        Route::post('/programs', [AdminController::class, 'storeProgram']);
        Route::put('/programs/{id}', [AdminController::class, 'updateProgram']);
        Route::post('/sections', [AdminController::class, 'storeSection']);
        Route::put('/sections/{id}', [AdminController::class, 'updateSection']);
    });
});
