<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class OperatorAlias extends Model
{
    protected $guarded = [];

    protected $casts = ['retrieved_at' => 'datetime', 'last_verified_at' => 'datetime'];

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }
}
