<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('notifications/index', [
            'notifications' => Auth::user()->notifications()->latest()->paginate(15)->through(fn (DatabaseNotification $notification) => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'اعلان جدید',
                'message' => $notification->data['message'] ?? '',
                'url' => $notification->data['url'] ?? '/dashboard',
                'read_at' => $notification->read_at,
                'created_at' => $notification->created_at,
            ]),
        ]);
    }

    public function read(DatabaseNotification $notification): RedirectResponse
    {
        abort_unless($notification->notifiable_id === Auth::id(), 403);

        $notification->markAsRead();

        return redirect()->to($notification->data['url'] ?? '/dashboard');
    }

    public function readAll(): RedirectResponse
    {
        Auth::user()?->unreadNotifications()->update(['read_at' => now()]);

        return redirect()->back();
    }
}
