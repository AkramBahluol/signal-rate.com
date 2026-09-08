<?php

namespace App\Models;

use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PlanFeature extends Model
{
    protected $guarded = [];

    protected $casts = ['value' => 'array', 'last_verified_at' => 'datetime', 'verification_status' => VerificationStatus::class];

    public function mobilePlan(): BelongsTo
    {
        return $this->belongsTo(MobilePlan::class);
    }
}
