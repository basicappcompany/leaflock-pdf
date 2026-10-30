import { format, type CommonMessages } from '../../i18n';
import type { TaskStatus } from './useTask';

/** Progress bar while working, and the error message if the task failed. */
export function TaskStatusView({ status, common }: { status: TaskStatus; common: CommonMessages }) {
  if (status.state === 'working') {
    const percent = status.progress === undefined ? undefined : Math.round(status.progress * 100);
    return (
      <div className="progress" role="status">
        <progress max={100} value={percent} aria-label={common.actions.working} />
        <span>{percent === undefined ? common.actions.working : format(common.actions.progress, { percent })}</span>
      </div>
    );
  }
  if (status.state === 'limited') {
    return (
      <p className="notice" role="alert">
        {status.message} <a href={status.actionHref}>{status.actionLabel}</a>
      </p>
    );
  }
  if (status.state === 'error') {
    return (
      <p className="error" role="alert">
        {status.message}
      </p>
    );
  }
  return null;
}
