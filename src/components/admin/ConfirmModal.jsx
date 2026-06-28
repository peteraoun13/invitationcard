import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  isLoading = false,
  error = "",
  onCancel,
  onConfirm,
}) {
  const cancelButtonRef = useRef(null);
  const isLoadingRef = useRef(isLoading);
  const onCancelRef = useRef(onCancel);
  isLoadingRef.current = isLoading;
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !isLoadingRef.current) {
        onCancelRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className="admin-confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onCancel();
        }
      }}
      role="presentation"
    >
      <section
        aria-describedby="admin-confirm-message"
        aria-labelledby="admin-confirm-title"
        aria-modal="true"
        className="admin-confirm-modal"
        role="dialog"
      >
        <p className="admin-eyebrow">Please confirm</p>
        <h2 id="admin-confirm-title">{title}</h2>
        <p className="admin-confirm-modal__message" id="admin-confirm-message">
          {message}
        </p>

        {error && (
          <p className="admin-alert admin-alert--error" role="alert">
            {error}
          </p>
        )}

        <div className="admin-confirm-modal__actions">
          <button
            className="admin-button admin-button--ghost"
            disabled={isLoading}
            onClick={onCancel}
            ref={cancelButtonRef}
            type="button"
          >
            Cancel
          </button>
          <button
            className="admin-button admin-button--danger-solid"
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
