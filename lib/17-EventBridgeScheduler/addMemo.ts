import {
  ActionAfterCompletion,
  CreateScheduleCommand,
  FlexibleTimeWindowMode,
  SchedulerClient,
} from '@aws-sdk/client-scheduler';

import { v4 as uuidv4 } from 'uuid';

const client = new SchedulerClient({});
const scheduleTargetArn = process.env.SCHEDULE_TARGET_ARN as string;
const scheduleRoleArn = process.env.SCHEDULE_ROLE_ARN as string;

if (scheduleTargetArn === undefined || scheduleRoleArn === undefined) {
  throw new Error('Missing environment variables');
}

export const handler = async ({ body }: { body: string }): Promise<{
  statusCode: number,
  body: string,
}> => {
  const { memo, date, time, timezone = 'Europe/Paris' } = JSON.parse(body) as { memo?: string, date?: string, timezone?: string, time?: string };

  if (memo === undefined || date === undefined) {
    return {
      statusCode: 400,
      body: 'Bad Request',
    };
  }

  const scheduleId = uuidv4();

  await client.send(new CreateScheduleCommand({
    Name: scheduleId,
    ScheduleExpressionTimezone: timezone,
    Target: {
      Arn: scheduleTargetArn,
      RoleArn: scheduleRoleArn,
      Input: JSON.stringify({ memo }),
    },
    ScheduleExpression: `at(${date}T${time})`,
    FlexibleTimeWindow: {
      Mode: FlexibleTimeWindowMode.OFF,
    },
    ActionAfterCompletion: ActionAfterCompletion.DELETE,
  }));

  return {
    statusCode: 200,
    body: 'Memo scheduled',
  }
}