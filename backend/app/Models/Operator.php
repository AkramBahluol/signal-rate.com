<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Operator extends Model
{
    protected $guarded = [];

    protected $casts = ['technologies' => 'array', 'prepaid' => 'boolean', 'postpaid' => 'boolean', 'esim' => 'boolean', 'four_g' => 'boolean', 'five_g' => 'boolean', 'active' => 'boolean', 'retrieved_at' => 'datetime', 'last_verified_at' => 'datetime'];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function mobilePlans(): HasMany
    {
        return $this->hasMany(MobilePlan::class);
    }

    public function networkAssignments(): HasMany
    {
        return $this->hasMany(MccMnc::class);
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(OperatorAlias::class);
    }
}
