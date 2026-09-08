<?php

namespace App\Models;

use App\Enums\VerificationStatus;
use Illuminate\Database\Eloquent\Model;

final class PlanVerification extends Model
{
    protected $guarded = [];

    protected $casts = ['checked_at' => 'datetime', 'verification_status' => VerificationStatus::class];
}
