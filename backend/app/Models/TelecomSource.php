<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class TelecomSource extends Model
{
    protected $guarded = [];

    protected $casts = ['active' => 'boolean'];

    public function snapshots(): HasMany
    {
        return $this->hasMany(TelecomSnapshot::class);
    }
}
