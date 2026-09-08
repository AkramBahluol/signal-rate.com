<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class MccMncChange extends Model
{
    protected $guarded = [];

    protected $casts = ['before' => 'array', 'after' => 'array'];
}
