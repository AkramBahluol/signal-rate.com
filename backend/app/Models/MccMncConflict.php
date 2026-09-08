<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class MccMncConflict extends Model
{
    protected $guarded = [];

    protected $casts = ['existing_value' => 'array', 'incoming_value' => 'array'];
}
