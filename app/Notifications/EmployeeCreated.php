<?php

namespace App\Notifications;

use App\Models\Employee;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmployeeCreated extends Notification
{
    use Queueable;
    /**
     * Create a new notification instance.
     */
    public function __construct(public Employee $employee)
    {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    
    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
       return [
            'title' => 'کارمند نو '. $this->employee->name . ' ثبت شد ',
            'message' => sprintf(
                'کارمند جدید %s ثبت گردید.',
                $this->employee->name,
            ),
            'transfer_id' => $this->employee->id,
            'url' => '/employees/'.$this->employee->id,
        ];
    }
}
