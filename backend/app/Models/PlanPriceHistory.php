<?php

namespace App\Models;

use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PlanPriceHistory extends Model
{
    protected $table = 'plan_price_history';

    protected $guarded = [];

    protected $casts = ['price' => 'decimal:2', 'previous_price' => 'decimal:2', 'new_price' => 'decimal:2', 'effective_from' => 'date', 'effective_to' => 'date', 'observed_at' => 'datetime', 'verification_status' => VerificationStatus::class];

    public function mobilePlan(): BelongsTo
    {
        return $this->belongsTo(MobilePlan::class);
    }
}
