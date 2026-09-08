<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class ErrorFamily extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return ['active' => 'boolean', 'last_verified_at' => 'datetime'];
    }

    public function errors(): HasMany
    {
        return $this->hasMany(ErrorEntry::class, 'family_id');
    }
}
