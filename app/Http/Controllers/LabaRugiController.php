<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Services\LabaRugiService;

class LabaRugiController extends Controller
{
     public function __construct(
        private LabaRugiService $service
    ) {}

    public function index(?int $bulan = null, ?int $tahun = null)
    {
        $bulan = $bulan ?? now()->month;
        $tahun = $tahun ?? now()->year;

        $data = $this->service->getLabaRugi($bulan, $tahun);
        return Inertia::render('laba-rugi/index', compact('data'));
    }
}
