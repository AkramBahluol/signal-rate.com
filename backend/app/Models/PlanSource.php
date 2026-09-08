<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class PlanSource extends Model
{
    protected $guarded = [];

    protected $casts = ['active' => 'boolean', 'last_fetched_at' => 'datetime'];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(PlanSourceSnapshot::class);
    }
}
