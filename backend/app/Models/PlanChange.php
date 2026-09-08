<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class PlanChange extends Model
{
    protected $guarded = [];

    protected $casts = ['changes' => 'array', 'observed_at' => 'datetime'];
}
