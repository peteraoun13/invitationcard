type StatusBadgeProps = {
  attending: boolean | null;
};

export function StatusBadge({ attending }: StatusBadgeProps) {
  if (attending === true) {
    return <span className="status-badge is-attending">Attending</span>;
  }

  if (attending === false) {
    return <span className="status-badge is-declined">Not attending</span>;
  }

  return <span className="status-badge is-pending">Pending</span>;
}
