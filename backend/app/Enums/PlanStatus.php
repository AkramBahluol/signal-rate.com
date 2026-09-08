<?php

namespace App\Enums;

enum PlanStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Discontinued = 'discontinued';
    case Unknown = 'unknown';
}
