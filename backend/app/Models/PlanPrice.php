<?php

namespace App\Models;

use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PlanPrice extends Model
{
    protected $guarded = [];

    protected $casts = ['price' => 'decimal:2', 'activation_fee' => 'decimal:2', 'upfront_fee' => 'decimal:2', 'is_current' => 'boolean', 'observed_at' => 'datetime', 'effective_from' => 'datetime', 'effective_to' => 'datetime', 'verification_status' => VerificationStatus::class];

    public function mobilePlan(): BelongsTo
    {
        return $this->belongsTo(MobilePlan::class);
    }
}
