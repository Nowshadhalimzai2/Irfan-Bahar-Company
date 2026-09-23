<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PaymentCreated extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(public Payment $payment)
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
        $this->payment->load('invoice:id,sale_id','invoice.sale:id,customer_id,customer_name','invoice.sale.customer:id,name');
        $sale = $this->payment->invoice->sale;

        return [
            'title' => 'پرداخت نو '. $this->payment->amount . ' ثبت شد ',
            'message' => sprintf(
                'پرداخت از طرف %s انجام داده شد',
                $sale->customer->name ?? $sale->customer_name,
            ),
            'payment_id' => $this->payment->id,
            'url' => '/payments/'.$this->payment->id.'/receipt',
        ];
    }
}
