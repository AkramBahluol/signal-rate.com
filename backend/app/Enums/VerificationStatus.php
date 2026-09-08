<?php

namespace App\Enums;

enum VerificationStatus: string
{
    case Verified = 'verified';
    case Stale = 'stale';
    case Unverified = 'unverified';
    case Failed = 'failed';
}
