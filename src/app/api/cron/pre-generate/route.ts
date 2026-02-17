import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTodayDate } from '@/lib/utils';
import { generateDynamicRoast, DynamicContent } from '@/lib/ai';

/**
 * PRE-GENERATION CRON JOB
 * Runs daily at 00:00 to generate 3 AI messages for different roast intensities
 * This saves API costs and ensures consistent messaging
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = getTodayDate();
    
    // Get automation settings
    let [s] = await db.select().from(settings).limit(1);
    if (!s) {
      [s] = await db.insert(settings).values({}).returning();
    }

    // Check if we already generated messages for today
    const existingRoast = s.aiRoast as any;
    if (existingRoast?.date === today) {
      return NextResponse.json({
        message: 'Messages already generated for today',
        date: today,
        existingMessages: {
          mild: !!existingRoast.mild,
          medium: !!existingRoast.medium,
          savage: !!existingRoast.savage
        }
      });
    }

    console.log(`Pre-generating AI messages for ${today}...`);

    // Generate messages for all 3 intensities
    const intensities = [
      { key: 'mild', name: 'Mild', prompt: 'Generate a gentle, encouraging reminder for coding practice. Keep it friendly and supportive.' },
      { key: 'medium', name: 'Medium', prompt: 'Generate a moderately firm reminder with light teasing. Be motivational but with some humor.' },
      { key: 'savage', name: 'Savage', prompt: 'Generate a brutally honest, no-mercy roast for someone who\'s slacking on coding. Be savage but not offensive.' }
    ];

    const generatedMessages: any = {};
    const errors: string[] = [];

    for (const intensity of intensities) {
      try {
        console.log(`Generating ${intensity.name} message...`);
        
        // Generate content for this intensity
        const contentResult: DynamicContent | null = await generateDynamicRoast(
          'Coder', // Generic name, will be replaced with [NAME] placeholder
          intensity.prompt
        );

        if (contentResult) {
          generatedMessages[intensity.key] = {
            fullMessage: contentResult.fullMessage,
            dashboardRoast: contentResult.dashboardRoast,
            subject: contentResult.subject || `Time to Code, [NAME]! 💻`,
            generatedAt: new Date().toISOString()
          };
          console.log(`✅ Generated ${intensity.name} message`);
        } else {
          errors.push(`Failed to generate ${intensity.name} message`);
          console.error(`❌ Failed to generate ${intensity.name} message`);
        }
      } catch (error) {
        const errorMsg = `Error generating ${intensity.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    // Store all generated messages
    generatedMessages.date = today;
    generatedMessages.generatedAt = new Date().toISOString();
    generatedMessages.errors = errors;

    await db.update(settings)
      .set({
        aiRoast: generatedMessages,
        updatedAt: new Date()
      })
      .where(eq(settings.id, s.id));

    const successCount = Object.keys(generatedMessages).filter(k => 
      ['mild', 'medium', 'savage'].includes(k) && generatedMessages[k]
    ).length;

    return NextResponse.json({
      message: 'Pre-generation completed',
      date: today,
      generated: {
        mild: !!generatedMessages.mild,
        medium: !!generatedMessages.medium,
        savage: !!generatedMessages.savage
      },
      successCount,
      totalCount: 3,
      errors: errors.length > 0 ? errors : undefined,
      generatedAt: generatedMessages.generatedAt
    });

  } catch (error) {
    console.error('Pre-generation cron error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Pre-generation failed' 
    }, { status: 500 });
  }
}