<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class CallingCode extends Model
{
    protected $guarded = [];

    protected $casts = ['primary' => 'boolean', 'retrieved_at' => 'datetime', 'last_verified_at' => 'datetime'];

    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }
}
