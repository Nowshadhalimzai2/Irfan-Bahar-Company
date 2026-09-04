<?php

namespace App\Notifications;

use App\Models\Transfer;
use Illuminate\Notifications\Notification;

class TransferCreated extends Notification
{
    public function __construct(public Transfer $transfer)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'انتقال جدید ثبت شد',
            'message' => sprintf(
                'انتقال %s از %s به %s ثبت گردید.',
                $this->transfer->reference_no,
                $this->transfer->source->name,
                $this->transfer->destination->name,
            ),
            'transfer_id' => $this->transfer->id,
            'url' => '/transfers/'.$this->transfer->id,
        ];
    }
}
