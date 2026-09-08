<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MccMnc extends Model
{
    protected $table = 'mcc_mnc';

    protected $guarded = [];

    protected $casts = ['technologies' => 'array', 'active' => 'boolean', 'retrieved_at' => 'datetime', 'last_verified_at' => 'datetime', 'last_seen_at' => 'datetime'];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }
}
