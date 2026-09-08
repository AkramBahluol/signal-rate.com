<?php

namespace App\Enums;

enum PlanType: string
{
    case Prepaid = 'prepaid';
    case Postpaid = 'postpaid';
    case SimOnly = 'sim_only';
    case Contract = 'contract';
}
