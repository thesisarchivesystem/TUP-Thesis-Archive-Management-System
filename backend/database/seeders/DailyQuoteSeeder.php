<?php

namespace Database\Seeders;

use App\Models\DailyQuote;
use Illuminate\Database\Seeder;

class DailyQuoteSeeder extends Seeder
{
    public function run(): void
    {
        $quotes = [
            ['body' => 'There is more treasure in books than in all the pirate\'s loot on Treasure Island.', 'author' => 'Walt Disney'],
            ['body' => 'A room without books is like a body without a soul.', 'author' => 'Marcus Tullius Cicero'],
            ['body' => 'The beautiful thing about learning is that no one can take it away from you.', 'author' => 'B.B. King'],
            ['body' => 'Education is the passport to the future, for tomorrow belongs to those who prepare for it today.', 'author' => 'Malcolm X'],
            ['body' => 'Research is creating new knowledge.', 'author' => 'Neil Armstrong'],
            ['body' => 'The important thing is not to stop questioning.', 'author' => 'Albert Einstein'],
            ['body' => 'Success is the sum of small efforts repeated day in and day out.', 'author' => 'Robert Collier'],
        ];

        $startDate = now()->startOfDay();

        foreach ($quotes as $index => $quote) {
            DailyQuote::updateOrCreate(
                ['quote_date' => $startDate->copy()->addDays($index)->toDateString()],
                [
                    'body' => $quote['body'],
                    'author' => $quote['author'],
                    'is_active' => true,
                ]
            );
        }
    }
}
