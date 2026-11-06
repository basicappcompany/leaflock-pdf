import { useCallback, useRef, useState } from 'react';
import { format, type CommonMessages } from '../../i18n';
import { JobError } from '../../lib/pdf/client';
import { reportError } from '../../lib/errorReporting';
import { ToolError } from '../../lib/pdf/errors';
import { PdfInputError, type PdfInputProblem } from '../../lib/pdf/inputError';
import { recordRun } from '../../lib/recentActivity';
import { UsageLimitError, type UsageLimitReason } from '../../lib/usage';

export type TaskStatus =
  | { state: 'idle' }
  | { state: 'working'; progress: number | undefined }
  | { state: 'done' }
  | { state: 'error'; message: string }
  /** The free tier's daily allowance is used up: a nudge with a link, not a failure. */
  | { state: 'limited'; message: string; actionLabel: string; actionHref: string };

const problemKey: Record<PdfInputProblem, keyof CommonMessages['errors']> = {
  'password-protected': 'passwordProtected',
  'wrong-password': 'wrongPassword',
  'not-a-pdf': 'notAPdf',
};

/**
 * Turns any failure into a sentence for the user. Tool-specific codes (from `ToolError`)
 * are looked up in `toolErrors`; anything unknown becomes the generic message.
 */
export function describeFailure(
  error: unknown,
  errors: CommonMessages['errors'],
  toolErrors: Record<string, string> = {},
): string {
  const failure =
    error instanceof JobError
      ? error.failure
      : error instanceof PdfInputError
        ? { kind: 'input' as const, fileName: error.fileName, problem: error.problem }
        : error instanceof ToolError
          ? { kind: 'tool' as const, code: error.code, values: error.values }
          : undefined;

  if (failure?.kind === 'input') {
    return format(errors[problemKey[failure.problem]], { name: failure.fileName });
  }
  if (failure?.kind === 'tool' && failure.code in toolErrors) {
    return format(toolErrors[failure.code]!, failure.values);
  }
  // Anything we didn't anticipate is a bug: log it and send a scrubbed report.
  console.error(error);
  reportError(error, 'job');
  return errors.unexpected;
}

function limitedStatus(reason: UsageLimitReason, errors: CommonMessages['errors']): TaskStatus {
  return reason === 'anonymous'
    ? {
        state: 'limited',
        message: errors.dailyLimitAnonymous,
        actionLabel: errors.dailyLimitAnonymousAction,
        actionHref: '/login/',
      }
    : {
        state: 'limited',
        message: errors.dailyLimitFree,
        actionLabel: errors.dailyLimitFreeAction,
        actionHref: '/pricing/',
      };
}

/**
 * Runs one piece of work at a time and tracks its status for the UI.
 * `run` resolves to the work's result, or `undefined` if it failed (the status then holds the message).
 */
export function useTask(errors: CommonMessages['errors'], toolErrors?: Record<string, string>) {
  const [status, setStatus] = useState<TaskStatus>({ state: 'idle' });
  const generation = useRef(0);

  const run = useCallback(
    async <T,>(work: (onProgress: (fraction: number) => void) => Promise<T>): Promise<T | undefined> => {
      const current = ++generation.current;
      setStatus({ state: 'working', progress: undefined });
      try {
        const result = await work((fraction) => {
          if (generation.current === current) setStatus({ state: 'working', progress: fraction });
        });
        if (generation.current !== current) return undefined;
        setStatus({ state: 'done' });
        // Only the tool and the time, stored on this device, for the home dashboard.
        recordRun();
        return result;
      } catch (error) {
        if (generation.current === current) {
          // Hitting the daily allowance isn't a bug, so it must not reach describeFailure,
          // which reports anything it doesn't recognise to /api/errors.
          setStatus(
            error instanceof UsageLimitError
              ? limitedStatus(error.reason, errors)
              : { state: 'error', message: describeFailure(error, errors, toolErrors) },
          );
        }
        return undefined;
      }
    },
    [errors, toolErrors],
  );

  /** Back to idle; any work still running is ignored when it finishes. */
  const reset = useCallback(() => {
    generation.current++;
    setStatus({ state: 'idle' });
  }, []);

  return { status, run, reset, working: status.state === 'working' };
}
