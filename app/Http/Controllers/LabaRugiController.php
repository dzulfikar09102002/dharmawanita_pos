<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
class LabaRugiController extends Controller
{
     public function index()
    {
        $pagination = $this->service->getLabaRugi();
        dd($pagination);
        return Inertia::render('laba-rugi/index', compact('pagination'));
    }
}
