<?php

namespace App\Enums;

enum InventoryType: string
{
    case IN = 'in';
    case OUT = 'out';
}

enum InventorySource: string
{
    case PURCHASE = 'purchase';
    case GIFT = 'gift';
    case SALE = 'sale';
    case DAMAGE = 'damage';
}