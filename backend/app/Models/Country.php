<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Country extends Model
{
    protected $guarded = [];

    protected $casts = ['timezones' => 'array', 'active' => 'boolean', 'retrieved_at' => 'datetime', 'last_verified_at' => 'datetime'];

    public function callingCodes(): HasMany
    {
        return $this->hasMany(CallingCode::class);
    }

    public function operators(): HasMany
    {
        return $this->hasMany(Operator::class);
    }

    public function mobilePlans(): HasMany
    {
        return $this->hasMany(MobilePlan::class);
    }

    public function networkAssignments(): HasMany
    {
        return $this->hasMany(MccMnc::class);
    }
}
