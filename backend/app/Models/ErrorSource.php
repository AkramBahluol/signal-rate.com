<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class ErrorSource extends Model
{
    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return ['last_verified_at' => 'datetime'];
    }
}
