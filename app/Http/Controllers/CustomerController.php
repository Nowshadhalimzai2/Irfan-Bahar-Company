<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function create()
    {
        return Inertia::render('customer/create');
    }
}
