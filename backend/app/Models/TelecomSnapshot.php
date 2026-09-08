<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TelecomSnapshot extends Model
{
    protected $guarded = [];

    protected $hidden = ['raw_payload'];

    protected $casts = ['retrieved_at' => 'datetime'];

    public function source(): BelongsTo
    {
        return $this->belongsTo(TelecomSource::class, 'telecom_source_id');
    }
}
