<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PlanSourceSnapshot extends Model
{
    protected $guarded = [];

    protected $casts = ['payload' => 'array', 'retrieved_at' => 'datetime'];

    public function source(): BelongsTo
    {
        return $this->belongsTo(PlanSource::class, 'plan_source_id');
    }
}
