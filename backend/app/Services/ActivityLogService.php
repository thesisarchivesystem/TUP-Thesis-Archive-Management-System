<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogService
{
    public function log(User $user, string $action, string $subjectType = null, string $subjectId = null, array $meta = []): ActivityLog
    {
        return ActivityLog::create([
            'user_id'      => $user->id,
            'action'       => $action,
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
            'meta'         => $meta,
        ]);
    }
}
