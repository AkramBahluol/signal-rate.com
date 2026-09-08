<?php

namespace App\Models;

use App\Enums\PlanStatus;
use App\Enums\PlanType;
use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class MobilePlan extends Model
{
    protected $guarded = [];

    protected $casts = [
        'plan_type' => PlanType::class, 'status' => PlanStatus::class,
        'verification_status' => VerificationStatus::class, 'price' => 'decimal:2',
        'activation_fee' => 'decimal:2', 'upfront_fee' => 'decimal:2',
        'unlimited_data' => 'boolean', 'unlimited_calls' => 'boolean', 'unlimited_sms' => 'boolean',
        'four_g' => 'boolean', 'five_g' => 'boolean', 'esim' => 'boolean', 'roaming' => 'boolean',
        'hotspot_allowed' => 'boolean', 'international_calls' => 'boolean',
        'first_seen_at' => 'datetime', 'last_seen_at' => 'datetime', 'last_verified_at' => 'datetime',
    ];

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function prices(): HasMany
    {
        return $this->hasMany(PlanPrice::class);
    }

    public function priceHistory(): HasMany
    {
        return $this->hasMany(PlanPriceHistory::class);
    }

    public function features(): HasMany
    {
        return $this->hasMany(PlanFeature::class);
    }

    public function verifications(): HasMany
    {
        return $this->hasMany(PlanVerification::class);
    }

    public function changes(): HasMany
    {
        return $this->hasMany(PlanChange::class);
    }
}
